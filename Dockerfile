# Dockerfile for queue-ticket-service

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for builds (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
# Use ci instead of install for more reliable builds
# Use --only=production to avoid installing dev dependencies
RUN npm ci --only=production

# Stage 2: Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

# Copy only production dependencies from builder stage
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Expose the port the app will run on
EXPOSE 3000

# Create volume for logs
VOLUME ["/app/logs"]

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Switch to non-root user
USER appuser

# Command to run the application
CMD ["node", "src/index.js"]