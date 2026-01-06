# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite (required at build time)
ARG VITE_KINDE_DOMAIN
ARG VITE_KINDE_ORGANIZATION_ID
ARG VITE_KINDE_CLIENT_ID
ARG VITE_KINDE_REDIRECT_URL
ARG VITE_KINDE_LOGOUT_URL
ARG VITE_KINDE_APPLE_CONNECTION_ID
ARG VITE_KINDE_FACEBOOK_CONNECTION_ID
ARG VITE_KINDE_GOOGLE_CONNECTION_ID
ARG VITE_KINDE_EMAIL_CODE_CONNECTION_ID
ARG VITE_KINDE_AUDIENCE
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_USE_FIREBASE_EMULATOR
ARG VITE_API_URL

# Build the app (env vars are baked in at build time)
RUN npm run build

# Frontend Production stage
FROM nginx:alpine AS production

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# API Production stage
FROM node:20-alpine AS api-production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy server file
COPY server-firestore.cjs ./

# Expose port
EXPOSE 3001

# Start API server
CMD ["node", "server-firestore.cjs"]
