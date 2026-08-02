#!/usr/bin/env bash
# Deploy frontend to DigitalPlat Pages
# NOTE: DigitalPlat API is behind Cloudflare Turnstile — use Digi AI or dashboard UI
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[PAGES]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

FRONTEND_DIR="frontend"
BUILD_DIR="$FRONTEND_DIR/dist"

if [[ ! -d "$BUILD_DIR" ]]; then
    error "Frontend not built. Run: cd frontend && npm run build"
fi

log "Deploying frontend to DigitalPlat Pages..."
log "Build directory: $BUILD_DIR"

API_KEY="${DIGITALPLAT_API_KEY:-dp_live_bfVSFY7olcqGlvGdhLDjkoRv}"
API_BASE="https://dash.domain.digitalplat.org/api/v1"

# Check if API is reachable (will likely get Turnstile challenge)
log "Checking DigitalPlat API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "403" || "$HTTP_CODE" == "503" ]]; then
    warn "DigitalPlat API blocked by Cloudflare Turnstile (HTTP $HTTP_CODE)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  MANUAL DEPLOYMENT REQUIRED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Option 1: Use Digi AI chatbot"
    echo "    → Go to https://dash.domain.digitalplat.org/digi-ai"
    echo "    → Say: 'Deploy my frontend to Pages'"
    echo "    → Upload the folder: $BUILD_DIR"
    echo ""
    echo "  Option 2: DigitalPlat Dashboard"
    echo "    → Go to DigitalPlat Dashboard > Pages"
    echo "    → Create/select project: exyo-app"
    echo "    → Upload folder: $BUILD_DIR"
    echo "    → Set domain: exyo.qd.je"
    echo ""
    echo "  After deployment, you'll get a Pages URL like:"
    echo "    https://exyo-xxxxx.pages.dev"
    echo ""
    echo "  Then set these env vars in the Pages dashboard:"
    echo "    VITE_API_URL=https://api.exyo.qd.je/api"
    echo "    VITE_APP_URL=https://exyo.qd.je"
    echo "    VITE_ADDON_URL=https://api.exyo.qd.je/api/content"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# If API somehow works, deploy via API
log "Creating deployment archive..."
tar -czf /tmp/exyo-frontend.tar.gz -C "$BUILD_DIR" .

log "Uploading to DigitalPlat Pages..."
RESULT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "$API_BASE/pages/deploy" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: multipart/form-data" \
    -F "file=@/tmp/exyo-frontend.tar.gz" \
    -F "domain=exyo.qd.je" \
    -F "env[VITE_API_URL]=https://api.exyo.qd.je/api" \
    -F "env[VITE_APP_URL]=https://exyo.qd.je" \
    -F "env[VITE_ADDON_URL]=https://api.exyo.qd.je/api/content" 2>&1)

HTTP_CODE=$(echo "$RESULT" | tail -1 | sed 's/HTTP_CODE://')
BODY=$(echo "$RESULT" | sed '$d')

rm -f /tmp/exyo-frontend.tar.gz

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    success "Frontend deployed to DigitalPlat Pages"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    error "Deployment failed (HTTP $HTTP_CODE): $BODY"
fi
