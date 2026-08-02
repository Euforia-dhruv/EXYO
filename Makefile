.PHONY: build build-frontend build-backend dev dev-frontend dev-backend db-studio \
       deploy deploy-pages deploy-edgeterm deploy-all update-dns check-deploy \
       check-health lint lint-fix typecheck clean install

# Build
build: build-frontend build-backend

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && npm run build

# Development
dev: dev-frontend & dev-backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

db-studio:
	cd backend && npx prisma studio

# Deployment
deploy: deploy-all

deploy-pages:
	@bash scripts/deploy-pages.sh

deploy-edgeterm:
	@bash scripts/deploy-edgeterm.sh

deploy-all:
	@bash scripts/deploy-all.sh

update-dns:
	@bash scripts/update-dns.sh

check-deploy:
	@bash scripts/check-deploy.sh

# Health
check-health:
	@bash scripts/health-check.sh

# Quality
lint:
	cd frontend && npm run lint 2>/dev/null; cd ../backend && npm run lint 2>/dev/null

lint-fix:
	cd frontend && npm run lint:fix 2>/dev/null; cd ../backend && npm run lint:fix 2>/dev/null

typecheck:
	cd frontend && npx tsc --noEmit
	cd backend && npx tsc --noEmit

# Utilities
install:
	cd frontend && npm install
	cd backend && npm install

clean:
	rm -rf frontend/dist backend/dist frontend/node_modules backend/node_modules
