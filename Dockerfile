# Dockerfile for Frontend
# Use an official Node.js runtime as a parent image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install any needed packages specified in package.json
RUN npm install --legacy-peer-deps

# Increase memory for building process
ENV NODE_OPTIONS="--max_old_space_size=2048"

# Build the React application
RUN npm run build

# Use a lightweight web server to serve the build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
