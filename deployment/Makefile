# Task Line Deployment Makefile
# Convenient shortcuts for Docker commands

.PHONY: help build up down logs clean test dev prod restart

help: ## Show this help message
	@echo "Task Line Deployment Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
dev: ## Start in development mode with hot reload
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build: ## Build and start in development mode
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down: ## Stop development containers
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Production Commands
prod: ## Start in production mode
	docker-compose up -d

prod-build: ## Build and start in production mode
	docker-compose up -d --build

prod-down: ## Stop production containers
	docker-compose down

# Build Commands
build: ## Build all images
	docker-compose build

build-backend: ## Build only backend
	docker-compose build backend

build-frontend: ## Build only frontend
	docker-compose build frontend

build-no-cache: ## Build all images without cache
	docker-compose build --no-cache

# Service Management
up: ## Start all services (detached)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

restart-backend: ## Restart only backend
	docker-compose restart backend

restart-frontend: ## Restart only frontend
	docker-compose restart frontend

# Logs
logs: ## Show logs (all services)
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

# Status
ps: ## Show running containers
	docker-compose ps

health: ## Check health status
	@echo "Backend Health:"
	@curl -s http://localhost:5001/api/health || echo "Backend not responding"
	@echo "\nFrontend Health:"
	@curl -s http://localhost:8080/health || echo "Frontend not responding"

# Database Commands
db-migrate: ## Run database migrations
	docker-compose exec backend sh -c "cd backend && alembic upgrade head"

db-migration: ## Create new migration (usage: make db-migration msg="description")
	docker-compose exec backend sh -c "cd backend && alembic revision --autogenerate -m '$(msg)'"

db-history: ## Show migration history
	docker-compose exec backend sh -c "cd backend && alembic history"

db-backup: ## Backup database
	@mkdir -p backups
	docker cp taskline-backend:/app/backend/db/taskline.db ./backups/backup-$$(date +%Y%m%d-%H%M%S).db
	@echo "Database backed up to backups/"

db-restore: ## Restore database (usage: make db-restore file=backup.db)
	docker cp $(file) taskline-backend:/app/backend/db/taskline.db
	docker-compose restart backend
	@echo "Database restored from $(file)"

# Shell Access
shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

# Cleanup
clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker system prune -f

clean-all: ## Remove everything including images
	docker-compose down -v --rmi all
	docker system prune -af

# Testing
test: ## Run tests in containers
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

test-backend: ## Run backend tests
	docker-compose exec backend pytest

test-frontend: ## Run frontend tests
	docker-compose exec frontend npm test

# Environment
env: ## Copy .env.example to .env
	cp .env.example .env
	@echo ".env file created. Please edit with your configuration."

# Quick Start
init: env prod-build ## Initialize and start the application
	@echo ""
	@echo "Task Line is starting..."
	@echo "Frontend: http://localhost:8080"
	@echo "Backend: http://localhost:5001"
	@echo ""
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make health' to check health status"
