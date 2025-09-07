# Use Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy web-demo files
COPY web-demo/ ./web-demo/
COPY server.js ./

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]