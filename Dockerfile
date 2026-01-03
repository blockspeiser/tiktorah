# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the web app
RUN npm run build:web

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Cloud Run uses PORT env variable (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
