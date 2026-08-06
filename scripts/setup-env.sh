#!/usr/bin/env bash
# EXYO Environment Setup Script
# Generates .env files with secure values

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[ENV]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64
}

echo ""
echo "=========================================="
echo "  EXYO Environment Setup"
echo "=========================================="
echo ""

# Generate secrets
log "Generating secure secrets..."
JWT_ACCESS_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
success "Secrets generated"

# Backend .env
log "Creating backend .env..."
cat > backend/.env << EOF
# EXYO Backend Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exyo"

# JWT Secrets (auto-generated - do not commit)
JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
ADDITIONAL_ORIGINS=

# Stremio Addons
STREMIO_DEFAULT_ADDON="https://v3-cinemeta.strem.io"
TORRENTIO_ADDON="https://torrentio.strem.fun"
EOF
success "backend/.env created"

# Backend .env.production
log "Creating backend .env.production..."
cat > backend/.env.production << EOF
# EXYO Backend Production Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

PORT=5000
NODE_ENV=production

# Database (update with your production URL)
DATABASE_URL="postgresql://user:password@host:5432/exyo"

# JWT Secrets (use generated values above)
JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=https://exyo.cc.cd
ADDITIONAL_ORIGINS=

# Stremio Addons
STREMIO_DEFAULT_ADDON="https://v3-cinemeta.strem.io"
TORRENTIO_ADDON="https://torrentio.strem.fun"
EOF
success "backend/.env.production created"

# Frontend .env
log "Creating frontend .env..."
cat > frontend/.env << EOF
# EXYO Frontend Environment
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
VITE_ADDON_URL=http://localhost:5000/api/content
EOF
success "frontend/.env created"

# Frontend .env.production
log "Creating frontend .env.production..."
cat > frontend/.env.production << EOF
# EXYO Frontend Production Environment
VITE_API_URL=https://api.exyo.cc.cd/api
VITE_APP_URL=https://exyo.cc.cd
VITE_ADDON_URL=https://api.exyo.cc.cd/api/content
EOF
success "frontend/.env.production created"

echo ""
echo "=========================================="
echo "  Environment Setup Complete"
echo "=========================================="
echo ""
echo "Generated files:"
echo "  - backend/.env (development)"
echo "  - backend/.env.production"
echo "  - frontend/.env (development)"
echo "  - frontend/.env.production"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Update DATABASE_URL in backend/.env.production"
echo "  2. Never commit .env files to git"
echo ""
echo "JWT Secrets (save these securely):"
echo "  ACCESS: $JWT_ACCESS_SECRET"
echo "  REFRESH: $JWT_REFRESH_SECRET"
echo ""
