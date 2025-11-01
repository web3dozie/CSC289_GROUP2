# Task Line - Deployment

This directory contains all Docker and deployment configurations for Task Line.

## Structure

```
deployment/
├── backend/              # Backend Docker configuration
│   ├── Dockerfile        # Production backend image
│   └── .dockerignore     # Backend build exclusions
├── frontend/             # Frontend Docker configuration
│   ├── Dockerfile        # Production frontend image (nginx)
│   ├── Dockerfile.dev    # Development frontend image
│   ├── nginx.conf        # Nginx configuration
│   └── .dockerignore     # Frontend build exclusions
├── docker-compose.yml    # Production compose configuration
├── docker-compose.dev.yml # Development overrides
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Development Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run in development mode:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - Backend Health: http://localhost:5001/api/health

### Production Setup

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Set production values (SECRET_KEY, etc.)
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5001

## Common Commands

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start Services
```bash
# Start in foreground
docker-compose up

# Start in background (detached)
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend sh

# Run database migrations
docker-compose exec backend sh -c "cd backend && alembic upgrade head"

# Frontend shell
docker-compose exec frontend sh
```

### Database Management
```bash
# Create new migration
docker-compose exec backend sh -c "cd backend && alembic revision --autogenerate -m 'description'"

# Apply migrations
docker-compose exec backend sh -c "cd backend && alembic upgrade head"

# View migration history
docker-compose exec backend sh -c "cd backend && alembic history"
```

## Health Checks

### Backend
```bash
curl http://localhost:5001/api/health
```

### Frontend
```bash
curl http://localhost:8080/health
```

### Container Health Status
```bash
docker-compose ps
```

## Volumes

- `taskline-backend-data`: Persistent SQLite database storage
- `taskline-backend-dev-data`: Development database (separate from production)

### Backup Database
```bash
docker cp taskline-backend:/app/backend/db/taskline.db ./backup-$(date +%Y%m%d).db
```

### Restore Database
```bash
docker cp ./backup.db taskline-backend:/app/backend/db/taskline.db
docker-compose restart backend
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :5001
lsof -i :8080

# Change ports in docker-compose.yml
# Example: "5002:5001" instead of "5001:5001"
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend

# Remove all containers and volumes
docker-compose down -v
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Manual migration
docker-compose exec backend sh -c "cd backend && alembic upgrade head"
```

### Frontend Build Fails
```bash
# Clear npm cache
docker-compose exec frontend npm cache clean --force

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

## CI/CD Integration

See `.github/workflows/ci.yml` for GitHub Actions integration.

### Docker Build in CI
The CI pipeline automatically:
- Builds Docker images
- Runs tests in containers
- Verifies health checks
- Pushes to container registry (production only)

## Production Considerations

1. **Environment Variables:**
   - Set strong `SECRET_KEY`
   - Enable `SESSION_COOKIE_SECURE=True` with HTTPS
   - Disable debug mode: `TASKLINE_DEBUG=0`

2. **Security:**
   - Use HTTPS reverse proxy (nginx, Traefik, etc.)
   - Set up firewall rules
   - Keep images updated

3. **Persistence:**
   - Backup `taskline-backend-data` volume regularly
   - Consider using external database in production

4. **Monitoring:**
   - Set up health check monitoring
   - Configure log aggregation
   - Monitor resource usage

## Development Workflow

1. **Make code changes** in `backend/` or `frontend/`
2. **For backend**: Changes reflect immediately (volume mounted)
3. **For frontend (dev mode)**: Hot reload active
4. **For frontend (prod mode)**: Rebuild required
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

## Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │    │   Backend    │ │
│  │   (nginx)    │───▶│   (Python)   │ │
│  │   Port 80    │    │   Port 5001  │ │
│  └──────────────┘    └──────────────┘ │
│         │                    │         │
│         │                    ▼         │
│         │            ┌──────────────┐ │
│         │            │   SQLite DB  │ │
│         │            │   (Volume)   │ │
│         │            └──────────────┘ │
└─────────────────────────────────────────┘
         │
         ▼
   Host: localhost:8080 (frontend)
   Host: localhost:5001 (backend)
```

## Support

For issues or questions, see the main project README or create an issue on GitHub.
