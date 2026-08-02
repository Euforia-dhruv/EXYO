#!/usr/bin/env bash
# Deploy all EXYO services to DigitalPlat
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log "=== EXYO Full Deployment ==="
echo ""

# Step 1: Build frontend
log "Step 1/5: Building frontend..."
cd "$SCRIPT_DIR/.." && cd frontend
npm ci --silent 2>/dev/null || npm install --silent
npx vite build 2>/dev/null || npm run build
cd "$SCRIPT_DIR/.."
success "Frontend built"

# Step 2: Build backend
log "Step 2/5: Building backend..."
cd "$SCRIPT_DIR/.." && cd backend
npm ci --silent 2>/dev/null || npm install --silent
npx tsc 2>/dev/null || npx tsc --outDir dist
cd "$SCRIPT_DIR/.."
success "Backend built"

# Step 3: Deploy frontend to DigitalPlat Pages
log "Step 3/5: Deploying frontend to DigitalPlat Pages..."
bash "$SCRIPT_DIR/deploy-pages.sh" || warn "Frontend deployment had issues"

# Step 4: Deploy backend to DigitalPlat EdgeTerm
log "Step 4/5: Deploying backend to DigitalPlat EdgeTerm..."
bash "$SCRIPT_DIR/deploy-edgeterm.sh" || warn "Backend deployment had issues"

# Step 5: Health check
log "Step 5/5: Running health checks..."
sleep 5

FRONTEND_URL="https://exyo.qd.je"
BACKEND_URL="https://api.exyo.qd.je/api/health"

if curl -s -f -o /dev/null "$FRONTEND_URL" 2>/dev/null; then
    success "Frontend accessible at $FRONTEND_URL"
else
    warn "Frontend not yet accessible (DNS may still be propagating)"
fi

if response=$(curl -s "$BACKEND_URL" 2>/dev/null); then
    if echo "$response" | grep -q '"status":"ok"'; then
        success "Backend healthy at $BACKEND_URL"
    else
        warn "Backend responded but health check unexpected: $response"
    fi
else
    warn "Backend not yet accessible (DNS may still be propagating)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Deployment complete!"
echo ""
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  https://api.exyo.qd.je"
echo ""
echo "  If DNS isn't working yet, add these records in Cloudflare:"
echo "    CNAME  @      exyo.pages.dev"
echo "    CNAME  api    jj33fiaf.up.railway.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
