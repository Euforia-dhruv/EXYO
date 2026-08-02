#!/usr/bin/env bash
# Update DNS records for exyo.qd.je via DigitalPlat Hosted DNS API
# Usage: ./scripts/update-dns.sh [pages-ip] [edgeterm-url]
# Run AFTER nameservers are set to dns1.digitalplat.org / dns2.digitalplat.org

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[DNS]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

DOMAIN="exyo.qd.je"
API_BASE="https://dash.domain.digitalplat.org/api/v1"
API_KEY="${DIGITALPLAT_API_KEY:-dp_live_bfVSFY7olcqGlvGdhLDjkoRv}"

PAGES_IP="${1:-}"
EDGETERM_URL="${2:-}"

if [[ -z "$PAGES_IP" || -z "$EDGETERM_URL" ]]; then
    error "Usage: $0 <pages-ip> <edgeterm-url>"
    echo "  pages-ip:     The IP address of your DigitalPlat Pages deployment"
    echo "  edgeterm-url: The URL of your DigitalPlat EdgeTerm backend"
    echo ""
    echo "Example: $0 203.0.113.50 https://exyo-backend.edgeterm.app"
fi

log "Updating DNS records for $DOMAIN..."

# Helper function for API calls
dp_api() {
    local method=$1 endpoint=$2 data=${3:-}
    local args=(-s -w "\nHTTP_CODE:%{http_code}" \
        -X "$method" \
        "$API_BASE$endpoint" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json")
    [[ -n "$data" ]] && args+=(--data "$data")
    curl "${args[@]}" 2>&1
}

# Step 1: Enable DigitalPlat Hosted DNS (if not already enabled)
log "Enabling DigitalPlat Hosted DNS..."
result=$(dp_api POST "/domains/$DOMAIN/dns/enable" '{"force":false}')
http_code=$(echo "$result" | tail -1 | sed 's/HTTP_CODE://')
body=$(echo "$result" | sed '$d')
if [[ "$http_code" == "200" || "$http_code" == "409" ]]; then
    success "Hosted DNS enabled (or already active)"
else
    warn "DNS enable returned HTTP $http_code - may need manual setup"
    echo "$body" | head -5
fi

# Step 2: Create A record for root (@) -> Pages IP
log "Creating A record: @ -> $PAGES_IP"
result=$(dp_api POST "/domains/$DOMAIN/dns/records" \
    "{\"type\":\"A\",\"name\":\"@\",\"value\":\"$PAGES_IP\",\"ttl\":3600}")
http_code=$(echo "$result" | tail -1 | sed 's/HTTP_CODE://')
if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    success "A record created for @ -> $PAGES_IP"
else
    warn "A record creation returned HTTP $http_code"
fi

# Step 3: Create CNAME record for api -> EdgeTerm URL
log "Creating CNAME record: api -> $EDGETERM_URL"
result=$(dp_api POST "/domains/$DOMAIN/dns/records" \
    "{\"type\":\"CNAME\",\"name\":\"api\",\"value\":\"$EDGETERM_URL\",\"ttl\":3600}")
http_code=$(echo "$result" | tail -1 | sed 's/HTTP_CODE://')
if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    success "CNAME record created for api -> $EDGETERM_URL"
else
    warn "CNAME record creation returned HTTP $http_code"
fi

# Step 4: Create CNAME record for www -> exyo.qd.je
log "Creating CNAME record: www -> $DOMAIN"
result=$(dp_api POST "/domains/$DOMAIN/dns/records" \
    "{\"type\":\"CNAME\",\"name\":\"www\",\"value\":\"$DOMAIN\",\"ttl\":3600}")
http_code=$(echo "$result" | tail -1 | sed 's/HTTP_CODE://')
if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    success "CNAME record created for www -> $DOMAIN"
else
    warn "CNAME record creation returned HTTP $http_code"
fi

log "DNS records updated. Propagation may take up to 24 hours."
log "Verify with: dig $DOMAIN A +short && dig api.$DOMAIN CNAME +short"
