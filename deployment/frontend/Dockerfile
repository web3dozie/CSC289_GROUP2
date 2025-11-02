# Multi-stage build for React + Vite frontend

# Stage 1: Use pre-built base image with dependencies already installed
FROM web3dozie/taskline-frontend-base:latest AS builder

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY deployment/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
