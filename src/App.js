import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const App = () => {
  const [labels, setLabels] = useState([]);
  const [datasetValues, setDatasetValues] = useState([]);
  const [tableData, setTableData] = useState([]); // State to store CSV data for table view
  const [uploadedFiles, setUploadedFiles] = useState([]); // State to store uploaded CSV files
  const [selectedFile, setSelectedFile] = useState(''); // State to track selected file from dropdown

  // Use the backend URL from environment variable or default to localhost
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    // Fetch previously uploaded CSV files from the backend
    refreshUploadedFiles();
  }, []);

  // Function to fetch uploaded files from backend
  const refreshUploadedFiles = () => {
    fetch(`${backendUrl}/api/get_csv_files`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Refreshed file list:", data); // Debugging output
        setUploadedFiles(data);
      })
      .catch((error) => console.error('Error fetching uploaded files:', error));
  };

  // Function to handle CSV upload
  const handleFileUpload = (event) => {
    const inputFile = event.target.files[0];
    if (!inputFile) {
      alert('Please select a CSV file first.');
      return;
    }
    Papa.parse(inputFile, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        processCSVData(results.data);
        saveUploadedFile(inputFile.name, results.data); // Save the uploaded file to the backend
      }
    });
  };

  // Function to process CSV data
  const processCSVData = (data) => {
    const labels = [];
    const datasetValues = [];

    data.forEach((row) => {
      if (row.Label && row.Value) {
        labels.push(row.Label);
        datasetValues.push(row.Value);
      }
    });

    setLabels(labels);
    setDatasetValues(datasetValues);
    setTableData(data); // Set table data to the parsed CSV data
  };

  // Function to draw the chart using Chart.js
  const drawChart = (labels, data) => {
    const ctx = document.getElementById('dataChart').getContext('2d');
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx).destroy(); // Destroy previous chart instance if it exists
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Data from CSV',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  useEffect(() => {
    if (labels.length > 0 && datasetValues.length > 0) {
      drawChart(labels, datasetValues);
    }
  }, [labels, datasetValues]);

  // Function to save uploaded file details to backend
  const saveUploadedFile = (fileName, data) => {
    console.log('Preparing to upload file:', { fileName, data });

    fetch(`${backendUrl}/api/upload_csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, data }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`Server error: ${response.status} - ${text}`);
          });
        }
        return response.json();
      })
      .then((result) => {
        console.log('File uploaded successfully:', result);
        refreshUploadedFiles(); // Refresh the list after uploading
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
      });
  };

  // Function to handle selecting a file from the dropdown
  const handleSelectFile = (event) => {
    const selectedFileName = event.target.value;
    setSelectedFile(selectedFileName);
    const file = uploadedFiles.find((f) => f.fileName === selectedFileName);
    if (file) {
      processCSVData(file.data);
    }
  };

  return (
    <div>
      <h1>Dashboard: CSV Data Visualization</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <div id="chart-container">
        <canvas id="dataChart"></canvas>
      </div>
      <div>
        <h2>CSV Data Table</h2>
        <table border="1">
          <thead>
            <tr>
              {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Uploaded Files</h2>
        <select onChange={handleSelectFile} value={selectedFile}>
          <option value="" disabled>Select a file to view</option>
          {uploadedFiles.map((file, index) => (
            <option key={index} value={file.fileName}>{file.fileName}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default App;
