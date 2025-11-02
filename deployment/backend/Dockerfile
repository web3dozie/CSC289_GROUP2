# Multi-stage Dockerfile for Task Line backend

# Base stage with common dependencies (use pre-built base image)
FROM web3dozie/taskline-backend-base:latest AS base

# Development stage
FROM base AS development

# Copy entire project
COPY . .

# Set Python path
ENV PYTHONPATH=/app:/app/backend

# Expose port
EXPOSE 5001

# Development command (with auto-reload, bind to 0.0.0.0 for Docker)
CMD ["sh", "-c", "cd backend && alembic upgrade head && cd .. && python -c 'import os; os.environ[\"TASKLINE_DEBUG\"] = \"1\"; from backend.app import create_app; app = create_app(); app.run(debug=True, host=\"0.0.0.0\", port=5001)'"]

# Production stage
FROM base AS production

# Copy entire project
COPY . .

# Set Python path
ENV PYTHONPATH=/app:/app/backend

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/api/health || exit 1

# Run with hypercorn (production ASGI server) bound to 0.0.0.0
CMD ["sh", "-c", "cd backend && alembic upgrade head && cd .. && hypercorn backend.app:app --bind 0.0.0.0:5001"]
