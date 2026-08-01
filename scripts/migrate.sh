#!/usr/bin/env bash
# EXYO Database Migration Script
# Usage: ./scripts/migrate.sh [dev|prod|seed]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MODE="${1:-dev}"

log() { echo -e "${BLUE}[DB]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

cd backend

case "$MODE" in
    dev)
        log "Running development migrations..."

        # Check if database exists
        if ! npx prisma db push --skip-generate 2>/dev/null; then
            log "Creating database schema..."
            npx prisma db push
        else
            log "Applying pending migrations..."
            npx prisma migrate dev
        fi

        success "Development database ready"

        ;;

    prod|production)
        log "Running production migrations..."

        if [[ -f ".env" ]]; then
            source .env
        elif [[ -f ".env.production" ]]; then
            source .env.production
        fi

        if [[ -z "${DATABASE_URL:-}" ]]; then
            error "DATABASE_URL not set"
        fi

        npx prisma migrate deploy
        success "Production migrations applied"

        ;;

    seed)
        log "Seeding database..."

        npx prisma db seed
        success "Database seeded"

        ;;

    reset)
        warn "This will destroy all data!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx prisma migrate reset
            success "Database reset complete"
        else
            log "Cancelled"
        fi

        ;;

    status)
        log "Checking migration status..."
        npx prisma migrate status
        ;;

    *)
        echo "Usage: $0 [dev|prod|seed|reset|status]"
        echo ""
        echo "Commands:"
        echo "  dev      - Run development migrations"
        echo "  prod     - Run production migrations"
        echo "  seed     - Seed database with initial data"
        echo "  reset    - Reset database (destroys data)"
        echo "  status   - Check migration status"
        exit 1
        ;;
esac
