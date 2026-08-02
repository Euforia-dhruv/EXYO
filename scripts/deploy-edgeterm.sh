#!/usr/bin/env bash
# Deploy backend to DigitalPlat EdgeTerm
# NOTE: DigitalPlat API is behind Cloudflare Turnstile — use Digi AI or dashboard UI
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[EDGETERM]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

BACKEND_DIR="backend"
BUILD_DIR="$BACKEND_DIR/dist"

if [[ ! -d "$BUILD_DIR" ]]; then
    error "Backend not built. Run: cd backend && npm run build"
fi

log "Deploying backend to DigitalPlat EdgeTerm..."
log "Build directory: $BUILD_DIR"

API_KEY="${DIGITALPLAT_API_KEY:-dp_live_bfVSFY7olcqGlvGdhLDjkoRv}"
API_BASE="https://dash.domain.digitalplat.org/api/v1"

# Check if API is reachable
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
    echo "    → Say: 'Deploy my backend to EdgeTerm'"
    echo "    → Upload the folder: $BUILD_DIR"
    echo ""
    echo "  Option 2: DigitalPlat Dashboard"
    echo "    → Go to DigitalPlat Dashboard > EdgeTerm"
    echo "    → Create/select service: exyo-api"
    echo "    → Upload folder: $BUILD_DIR"
    echo "    → Set start command: node dist/server.js"
    echo "    → Set domain: api.exyo.qd.je"
    echo "    → Set PORT: 8080"
    echo ""
    echo "  Environment Variables to set:"
    echo "    NODE_ENV=production"
    echo "    PORT=8080"
    echo "    DATABASE_URL=postgresql://postgres:***@postgres.railway.internal:5432/railway"
    echo "    JWT_ACCESS_SECRET=6a7f351e210d9ac6f6cc91189cc95b54145c20b9d04f082da1a31026e7d9c926"
    echo "    JWT_REFRESH_SECRET=b1f2aea8b347ea2aa74cd3b7050c7b30cdc43a9ddf81e2568b9774301af11c5a"
    echo "    JWT_ACCESS_EXPIRY=1h"
    echo "    JWT_REFRESH_EXPIRY=7d"
    echo "    CORS_ORIGIN=https://exyo.qd.je,https://www.exyo.qd.je,https://exyo.pages.dev"
    echo "    STREMIO_DEFAULT_ADDON=https://v3-cinemeta.strem.io"
    echo "    TORRENTIO_ADDON=https://torrentio.strem.fun"
    echo ""
    echo "  After deployment, you'll get a URL like:"
    echo "    https://exyo-api-xxxxx.edgeterm.app"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# If API somehow works, deploy via API
log "Creating deployment archive..."
tar -czf /tmp/exyo-backend.tar.gz -C "$BUILD_DIR" . --exclude='*.map'

log "Uploading to DigitalPlat EdgeTerm..."
RESULT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "$API_BASE/edgeterm/deploy" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: multipart/form-data" \
    -F "file=@/tmp/exyo-backend.tar.gz" \
    -F "domain=api.exyo.qd.je" \
    -F "start_command=node dist/server.js" \
    -F "env[NODE_ENV]=production" \
    -F "env[PORT]=8080" \
    -F "env[DATABASE_URL]=postgresql://postgres:vxXVAojdWtRVWJZLryCVOeQTEYQLvePo@postgres.railway.internal:5432/railway" \
    -F "env[JWT_ACCESS_SECRET]=6a7f351e210d9ac6f6cc91189cc95b54145c20b9d04f082da1a31026e7d9c926" \
    -F "env[JWT_REFRESH_SECRET]=b1f2aea8b347ea2aa74cd3b7050c7b30cdc43a9ddf81e2568b9774301af11c5a" \
    -F "env[JWT_ACCESS_EXPIRY]=1h" \
    -F "env[JWT_REFRESH_EXPIRY]=7d" \
    -F "env[CORS_ORIGIN]=https://exyo.qd.je,https://www.exyo.qd.je,https://exyo.pages.dev" \
    -F "env[STREMIO_DEFAULT_ADDON]=https://v3-cinemeta.strem.io" \
    -F "env[TORRENTIO_ADDON]=https://torrentio.strem.fun" 2>&1)

HTTP_CODE=$(echo "$RESULT" | tail -1 | sed 's/HTTP_CODE://')
BODY=$(echo "$RESULT" | sed '$d')

rm -f /tmp/exyo-backend.tar.gz

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    success "Backend deployed to DigitalPlat EdgeTerm"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    error "Deployment failed (HTTP $HTTP_CODE): $BODY"
fi
