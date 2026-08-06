#!/usr/bin/env bash
# EXYO Health Check & Monitoring Script
# Usage: ./scripts/health-check.sh [--continuous] [--interval 30]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FRONTEND_URL="${VITE_APP_URL:-https://exyo.cc.cd}"
BACKEND_URL="${VITE_API_URL:-https://api.exyo.cc.cd/api}"
HEALTH_ENDPOINT="$BACKEND_URL/health"

CONTINUOUS=false
INTERVAL=30

while [[ $# -gt 0 ]]; do
    case $1 in
        --continuous) CONTINUOUS=true; shift ;;
        --interval) INTERVAL="$2"; shift 2 ;;
        *) shift ;;
    esac
done

check_count=0
fail_count=0

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; }

run_checks() {
    check_count=$((check_count + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Health Check #$check_count"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Frontend check
    echo ""
    log "Frontend ($FRONTEND_URL)..."
    if response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$FRONTEND_URL" 2>/dev/null); then
        if [[ "$response" == "200" ]]; then
            success "Frontend responding (HTTP $response)"
        else
            warn "Frontend returned HTTP $response"
            fail_count=$((fail_count + 1))
        fi
    else
        fail "Frontend unreachable"
        fail_count=$((fail_count + 1))
    fi

    # Backend health check
    echo ""
    log "Backend ($HEALTH_ENDPOINT)..."
    if response=$(curl -s --connect-timeout 10 "$HEALTH_ENDPOINT" 2>/dev/null); then
        if echo "$response" | grep -q '"status":"ok"'; then
            success "Backend healthy"
            if echo "$response" | grep -q '"environment"'; then
                env=$(echo "$response" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
                success "Environment: $env"
            fi
        else
            warn "Backend returned unexpected response"
            fail_count=$((fail_count + 1))
        fi
    else
        fail "Backend unreachable"
        fail_count=$((fail_count + 1))
    fi

    # API endpoints check
    echo ""
    log "API Endpoints..."

    # Auth endpoint (should return 401 or 400 without data)
    if response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$BACKEND_URL/auth/login" 2>/dev/null); then
        if [[ "$response" == "400" || "$response" == "401" || "$response" == "405" ]]; then
            success "Auth endpoint responding (HTTP $response)"
        else
            warn "Auth endpoint returned HTTP $response"
        fi
    else
        fail "Auth endpoint unreachable"
    fi

    # Content endpoint
    if response=$(curl -s --connect-timeout 10 "$BACKEND_URL/content/catalogs?type=movie&catalogId=top" 2>/dev/null); then
        if echo "$response" | grep -q '\['; then
            success "Content API responding"
        else
            warn "Content API returned unexpected format"
        fi
    else
        fail "Content API unreachable"
    fi

    # DNS check
    echo ""
    log "DNS Resolution..."
    if host exyo.cc.cd >/dev/null 2>&1; then
        ip=$(dig +short exyo.cc.cd | head -1)
        success "exyo.cc.cd resolves to $ip"
    else
        warn "DNS not yet propagated for exyo.cc.cd"
    fi

    if host api.exyo.cc.cd >/dev/null 2>&1; then
        ip=$(dig +short api.exyo.cc.cd | head -1)
        success "api.exyo.cc.cd resolves to $ip"
    else
        warn "DNS not yet propagated for api.exyo.cc.cd"
    fi

    # SSL check
    echo ""
    log "SSL Certificate..."
    if echo | openssl s_client -connect exyo.cc.cd:443 -servername exyo.cc.cd 2>/dev/null | grep -q "BEGIN CERTIFICATE"; then
        expiry=$(echo | openssl s_client -connect exyo.cc.cd:443 -servername exyo.cc.cd 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        success "SSL certificate valid (expires: $expiry)"
    else
        warn "SSL certificate not yet provisioned"
    fi

    # Summary
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [[ $fail_count -eq 0 ]]; then
        success "All checks passed!"
    else
        warn "$fail_count issues detected"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

if [[ "$CONTINUOUS" == true ]]; then
    log "Running continuous health checks (interval: ${INTERVAL}s)"
    log "Press Ctrl+C to stop"
    while true; do
        fail_count=0
        run_checks
        echo ""
        log "Next check in ${INTERVAL}s..."
        sleep "$INTERVAL"
    done
else
    run_checks
fi
