#!/usr/bin/env bash
# Check deployment status for EXYO
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[CHECK]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; }
warn() { echo -e "${YELLOW}[~]${NC} $1"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXYO Deployment Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check frontend
log "Frontend (exyo.qd.je)..."
if curl -s -f -o /dev/null "https://exyo.qd.je" 2>/dev/null; then
    success "Frontend accessible"
else
    fail "Frontend not accessible"
fi

# Check Cloudflare Pages direct
log "Cloudflare Pages (exyo.pages.dev)..."
if curl -s -f -o /dev/null "https://exyo.pages.dev" 2>/dev/null; then
    success "Cloudflare Pages accessible"
else
    fail "Cloudflare Pages not accessible"
fi

# Check backend via Railway (current)
log "Backend (Railway)..."
if response=$(curl -s "https://exyo-api-production.up.railway.app/api/health" 2>/dev/null); then
    if echo "$response" | grep -q '"status":"ok"'; then
        success "Railway backend healthy"
    else
        warn "Railway backend responded: $response"
    fi
else
    fail "Railway backend not accessible"
fi

# Check backend via custom domain
log "Backend (api.exyo.qd.je)..."
if response=$(curl -s "https://api.exyo.qd.je/api/health" 2>/dev/null); then
    if echo "$response" | grep -q '"status":"ok"'; then
        success "Custom domain backend healthy"
    else
        warn "Custom domain backend responded: $response"
    fi
else
    fail "Custom domain backend not accessible (DNS may not be set up)"
fi

# Check DNS
log "DNS records..."
FRONTEND_IP=$(dig +short exyo.qd.je A 2>/dev/null || echo "none")
API_CNAME=$(dig +short api.exyo.qd.je CNAME 2>/dev/null || echo "none")

if [[ "$FRONTEND_IP" != "none" && -n "$FRONTEND_IP" ]]; then
    success "exyo.qd.je resolves to: $FRONTEND_IP"
else
    fail "exyo.qd.je has no A record"
fi

if [[ "$API_CNAME" != "none" && -n "$API_CNAME" ]]; then
    success "api.exyo.qd.je resolves to: $API_CNAME"
else
    fail "api.exyo.qd.je has no CNAME record"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
