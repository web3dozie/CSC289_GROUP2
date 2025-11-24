# TaskLine - Single Container Dockerfile
# Complete all-in-one container with frontend + backend + nginx

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy frontend source
COPY frontend/ .

# Build production assets
RUN npm run build

# ============================================
# Stage 2: Build Documentation
# ============================================
FROM python:3.12-slim AS docs-builder

WORKDIR /docs

# Install mkdocs and material theme
RUN pip install --no-cache-dir mkdocs mkdocs-material

# Copy docs source
COPY docs-site/ .

# Build static documentation
RUN mkdocs build

# ============================================
# Stage 3: Python Dependencies
# ============================================
FROM python:3.12-slim AS python-deps

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ============================================
# Stage 4: Production Image
# ============================================
FROM python:3.12-slim

# Install nginx, supervisor, and curl for health checks
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm /etc/nginx/sites-enabled/default

# Set working directory
WORKDIR /app

# Copy Python packages from deps stage
COPY --from=python-deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy backend application
COPY backend/ ./backend/
COPY .env.example .env.example

# Copy built frontend to nginx html directory
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy built documentation to nginx html directory
COPY --from=docs-builder /docs/site /usr/share/nginx/html/docs

# Copy nginx configuration
COPY deployment/nginx-single.conf /etc/nginx/sites-enabled/taskline.conf

# Copy supervisord configuration
COPY deployment/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p /app/backend/db \
    /var/log/supervisor \
    /data

# Set environment variables
ENV PYTHONPATH=/app:/app/backend \
    PYTHONUNBUFFERED=1 \
    TASKLINE_DEBUG=0 \
    DATABASE_URL=sqlite+aiosqlite:////data/taskline.db

# Create a startup script
RUN echo '#!/bin/sh\n\
# Ensure data directory exists\n\
mkdir -p /data\n\
\n\
# If database doesnt exist, run migrations\n\
if [ ! -f /data/taskline.db ]; then\n\
    echo "Running database migrations..."\n\
    cd /app/backend && alembic upgrade head\n\
fi\n\
\n\
# Start supervisord\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3456

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3456/health || exit 1

# Volume for persistent data
VOLUME ["/data"]

# Start the application
CMD ["/app/start.sh"]
