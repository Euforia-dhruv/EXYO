.PHONY: help install build dev deploy health migrate clean

# EXYO Makefile
# Run 'make help' to see available commands

help: ## Show this help
	@echo "EXYO - Available Commands:"
	@echo "=========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Dependencies installed"

build: ## Build frontend and backend
	cd frontend && npm run build
	cd backend && npm run build
	@echo "✅ Build complete"

build-frontend: ## Build frontend only
	cd frontend && npm run build
	@echo "✅ Frontend built"

build-backend: ## Build backend only
	cd backend && npm run build
	@echo "✅ Backend built"

dev: ## Start development servers
	@echo "Starting backend..."
	cd backend && npm run dev &
	@echo "Starting frontend..."
	cd frontend && npm run dev
	@echo "✅ Development servers running"

dev-backend: ## Start backend dev server only
	cd backend && npm run dev

dev-frontend: ## Start frontend dev server only
	cd frontend && npm run dev

db-setup: ## Setup database (development)
	./scripts/migrate.sh dev
	@echo "✅ Database ready"

db-migrate: ## Run production migrations
	./scripts/migrate.sh prod
	@echo "✅ Migrations applied"

db-seed: ## Seed database
	./scripts/migrate.sh seed
	@echo "✅ Database seeded"

db-reset: ## Reset database (WARNING: destroys data)
	./scripts/migrate.sh reset

db-status: ## Check migration status
	./scripts/migrate.sh status

setup-env: ## Generate environment files
	./scripts/setup-env.sh
	@echo "✅ Environment files created"

deploy: build ## Deploy to DigitalPlat
	./scripts/deploy.sh all
	@echo "✅ Deployment complete"

deploy-frontend: build-frontend ## Deploy frontend only
	./scripts/deploy.sh frontend

deploy-backend: build-backend ## Deploy backend only
	./scripts/deploy.sh backend

health: ## Run health checks
	./scripts/health-check.sh

health-continuous: ## Run continuous health checks
	./scripts/health-check.sh --continuous --interval 30

typecheck: ## Run TypeScript checks
	cd frontend && npx tsc --noEmit
	cd backend && npx tsc --noEmit
	@echo "✅ TypeScript clean"

lint: ## Run linters
	cd frontend && npm run lint
	@echo "✅ Linting complete"

clean: ## Clean build artifacts
	rm -rf frontend/dist backend/dist
	rm -rf frontend/node_modules backend/node_modules
	@echo "✅ Clean complete"

docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

test: typecheck build ## Run all checks
	./scripts/health-check.sh
	@echo "✅ All checks passed"
