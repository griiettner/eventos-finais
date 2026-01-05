# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for SQLite database
RUN mkdir -p /data/db

# Copy server files
COPY server.js /app/server.js
COPY package.json /app/package.json

# Install server dependencies
WORKDIR /app
RUN npm ci --production

# Expose ports
EXPOSE 80 3000

# Start both nginx and server
CMD ["sh", "-c", "nginx -g 'daemon off;' & node server.js"]
