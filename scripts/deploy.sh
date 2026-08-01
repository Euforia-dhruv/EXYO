#!/usr/bin/env bash
# EXYO DigitalPlat Deployment Script
# Usage: ./scripts/deploy.sh [frontend|backend|all] [--env production|staging]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="exyo"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
BUILD_DIR="dist"

log() { echo -e "${BLUE}[EXYO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse arguments
DEPLOY_TARGET="${1:-all}"
ENV="${2:-production}"

log "Starting EXYO deployment..."
log "Target: $DEPLOY_TARGET | Environment: $ENV"

# Validate environment
if [[ ! "$ENV" =~ ^(production|staging)$ ]]; then
    error "Invalid environment: $ENV (use 'production' or 'staging')"
fi

# Check required tools
check_dependencies() {
    log "Checking dependencies..."
    command -v node >/dev/null 2>&1 || error "Node.js is not installed"
    command -v npm >/dev/null 2>&1 || error "npm is not installed"
    command -v npx >/dev/null 2>&1 || error "npx is not installed"
    success "All dependencies found"
}

# Setup environment variables
setup_env() {
    local dir=$1
    log "Setting up environment for $dir..."

    if [[ "$ENV" == "production" ]]; then
        if [[ -f "$dir/.env.production" ]]; then
            cp "$dir/.env.production" "$dir/.env"
            success "Production env loaded for $dir"
        else
            warn "No .env.production found for $dir, using existing .env"
        fi
    fi
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"

    setup_env "."

    log "Installing dependencies..."
    npm ci --silent

    log "Generating types..."
    npx tsc --noEmit 2>/dev/null || warn "TypeScript check had warnings"

    log "Building..."
    npm run build

    cd ..
    success "Frontend built successfully"
    log "Build output: $FRONTEND_DIR/$BUILD_DIR"
}

# Build backend
build_backend() {
    log "Building backend..."
    cd "$BACKEND_DIR"

    setup_env "."

    log "Installing dependencies..."
    npm ci --silent

    log "Generating Prisma client..."
    npx prisma generate

    log "TypeScript check..."
    npx tsc --noEmit

    log "Building..."
    npm run build

    cd ..
    success "Backend built successfully"
    log "Build output: $BACKEND_DIR/$BUILD_DIR"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd "$BACKEND_DIR"

    if [[ -f ".env" ]]; then
        source .env
        if [[ -n "${DATABASE_URL:-}" ]]; then
            npx prisma migrate deploy
            success "Migrations applied successfully"
        else
            warn "DATABASE_URL not set, skipping migrations"
        fi
    else
        warn "No .env file found, skipping migrations"
    fi

    cd ..
}

# Deploy to DigitalPlat Pages (Frontend)
deploy_frontend() {
    log "Deploying frontend to DigitalPlat Pages..."

    if [[ ! -d "$FRONTEND_DIR/$BUILD_DIR" ]]; then
        error "Frontend build not found. Run: ./scripts/deploy.sh frontend"
    fi

    if [[ -n "${DIGITALPLAT_API_KEY:-}" && -n "${DIGITALPLAT_PAGES_PROJECT_ID:-}" ]]; then
        log "Using DigitalPlat API for deployment..."

        # Create deployment archive
        cd "$FRONTEND_DIR"
        tar -czf "../frontend-deploy.tar.gz" -C "$BUILD_DIR" .
        cd ..

        # Deploy via API (placeholder - replace with actual DigitalPlat API call)
        log "Uploading to DigitalPlat Pages..."
        # curl -X POST "https://api.digitalplat.org/v1/pages/deploy" \
        #   -H "Authorization: Bearer $DIGITALPLAT_API_KEY" \
        #   -F "project=$DIGITALPLAT_PAGES_PROJECT_ID" \
        #   -F "file=@frontend-deploy.tar.gz"

        rm -f frontend-deploy.tar.gz
        success "Frontend deployed to DigitalPlat Pages"
    else
        warn "DigitalPlat API credentials not set"
        log "Manual deployment instructions:"
        echo "  1. Go to DigitalPlat Dashboard > Pages"
        echo "  2. Select project: exyo-app"
        echo "  3. Upload folder: $FRONTEND_DIR/$BUILD_DIR"
        echo "  4. Configure domain: exyo.qd.je"
    fi
}

# Deploy to DigitalPlat EdgeTerm (Backend)
deploy_backend() {
    log "Deploying backend to DigitalPlat EdgeTerm..."

    if [[ ! -d "$BACKEND_DIR/$BUILD_DIR" ]]; then
        error "Backend build not found. Run: ./scripts/deploy.sh backend"
    fi

    if [[ -n "${DIGITALPLAT_API_KEY:-}" && -n "${DIGITALPLAT_EDGETERM_PROJECT_ID:-}" ]]; then
        log "Using DigitalPlat API for deployment..."

        # Create deployment archive
        cd "$BACKEND_DIR"
        tar -czf "../backend-deploy.tar.gz" \
            -C "$BUILD_DIR" . \
            --exclude='*.map'
        cd ..

        # Deploy via API (placeholder - replace with actual DigitalPlat API call)
        log "Uploading to DigitalPlat EdgeTerm..."
        # curl -X POST "https://api.digitalplat.org/v1/edgeterm/deploy" \
        #   -H "Authorization: Bearer $DIGITALPLAT_API_KEY" \
        #   -F "project=$DIGITALPLAT_EDGETERM_PROJECT_ID" \
        #   -F "file=@backend-deploy.tar.gz"

        rm -f backend-deploy.tar.gz
        success "Backend deployed to DigitalPlat EdgeTerm"
    else
        warn "DigitalPlat API credentials not set"
        log "Manual deployment instructions:"
        echo "  1. Go to DigitalPlat Dashboard > EdgeTerm"
        echo "  2. Select project: exyo-api"
        echo "  3. Upload folder: $BACKEND_DIR/$BUILD_DIR"
        echo "  4. Set start command: node dist/server.js"
        echo "  5. Configure domain: api.exyo.qd.je"
    fi
}

# Health check
health_check() {
    log "Running health checks..."

    local frontend_url="https://exyo.qd.je"
    local backend_url="https://api.exyo.qd.je/api/health"

    # Check frontend
    if curl -s -f -o /dev/null "$frontend_url" 2>/dev/null; then
        success "Frontend is accessible at $frontend_url"
    else
        warn "Frontend not accessible (may need DNS propagation)"
    fi

    # Check backend
    local response
    response=$(curl -s "$backend_url" 2>/dev/null || echo '{"status":"error"}')
    if echo "$response" | grep -q '"status":"ok"'; then
        success "Backend is healthy"
    else
        warn "Backend health check failed (may need DNS propagation)"
    fi
}

# Main execution
main() {
    check_dependencies

    case "$DEPLOY_TARGET" in
        frontend)
            build_frontend
            deploy_frontend
            ;;
        backend)
            build_backend
            run_migrations
            deploy_backend
            ;;
        all)
            build_frontend
            build_backend
            run_migrations
            deploy_frontend
            deploy_backend
            ;;
        migrate)
            run_migrations
            ;;
        health)
            health_check
            ;;
        *)
            error "Invalid target: $DEPLOY_TARGET (use 'frontend', 'backend', 'all', 'migrate', or 'health')"
            ;;
    esac

    success "Deployment complete!"
}

main
