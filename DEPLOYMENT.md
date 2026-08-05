# EXYO Deployment Guide

This guide covers deploying EXYO to DigitalPlat infrastructure.

## Prerequisites

- DigitalPlat account with Pages, EdgeTerm, and Mail Relay enabled
- Domain: exyo.cc.cd configured with Vercel nameservers (ns1.vercel-dns.com, ns2.vercel-dns.com)
- PostgreSQL database (Supabase, Railway, or DigitalPlat Database)
- Node.js 20+ installed locally

## Step 1: Database Setup

### Option A: Supabase (Recommended)
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Save it as `DATABASE_URL` for later

### Option B: Railway
1. Create account at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy the connection string
4. Save it as `DATABASE_URL`

## Step 2: Environment Variables

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -hex 32
# Run twice for access and refresh secrets
```

### Backend Environment Variables

Create these in your deployment platform:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=https://exyo.qd.je
EMAIL_HOST=smtp.digitalplat.org
EMAIL_PORT=587
EMAIL_USER=admin@exyo.qd.je
EMAIL_PASS=<your-email-password>
STREMIO_DEFAULT_ADDON=https://v3-cinemeta.strem.io
TORRENTIO_ADDON=https://torrentio.strem.fun
```

### Frontend Environment Variables

```
VITE_API_URL=https://api.exyo.qd.je/api
VITE_APP_URL=https://exyo.qd.je
```

## Step 3: Deploy Backend to EdgeTerm

### Manual Deployment

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# The dist/ folder is ready for deployment
```

### Via DigitalPlat Dashboard

1. Log into DigitalPlat Dashboard
2. Go to EdgeTerm section
3. Create new project: `exyo-api`
4. Connect your GitHub repository
5. Set build command: `cd backend && npm install && npx prisma generate && npm run build`
6. Set start command: `node dist/server.js`
7. Add all environment variables
8. Deploy

## Step 4: Deploy Frontend to Pages

### Manual Deployment

```bash
cd frontend

# Install dependencies
npm install

# Build for production
VITE_API_URL=https://api.exyo.qd.je/api npm run build

# The dist/ folder is ready for deployment
```

### Via DigitalPlat Dashboard

1. Log into DigitalPlat Dashboard
2. Go to Pages section
3. Create new project: `exyo-app`
4. Connect your GitHub repository
5. Set build command: `cd frontend && npm install && npm run build`
6. Set output directory: `frontend/dist`
7. Add environment variables
8. Deploy

## Step 5: DNS Configuration

In your DigitalPlat DNS dashboard:

### Records to Add

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | DigitalPlat Pages IP | 3600 |
| CNAME | api | your-edgeterm-url.digitalplat.org | 3600 |
| MX | @ | mail.digitalplat.org (priority 10) | 3600 |

### Verify DNS

```bash
# Check DNS propagation
dig exyo.qd.je
dig api.exyo.qd.je
```

## Step 6: SSL/HTTPS

DigitalPlat Pages automatically provisions SSL certificates. Verify:

1. Visit https://exyo.qd.je
2. Check for the lock icon in browser
3. Verify API at https://api.exyo.qd.je/api/health

## Step 7: Email Setup

1. Go to DigitalPlat Mail Relay dashboard
2. Verify your domain: exyo.qd.je
3. Create SMTP credentials
4. Test email delivery:

```bash
# Test via API
curl -X POST https://api.exyo.qd.je/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Step 8: Verification Checklist

### Frontend
- [ ] https://exyo.qd.je loads correctly
- [ ] Login page works
- [ ] Register page works
- [ ] Home page shows content
- [ ] Search works
- [ ] Video player works

### Backend
- [ ] https://api.exyo.qd.je/api/health returns OK
- [ ] Register creates new user
- [ ] Login returns tokens
- [ ] Password reset sends email
- [ ] Content API returns data
- [ ] Streams play correctly

### Email
- [ ] Welcome email sends on register
- [ ] Password reset email sends
- [ ] Emails render correctly

## Troubleshooting

### CORS Errors
- Verify CORS_ORIGIN matches your frontend URL exactly
- Check for trailing slashes

### Database Connection
- Verify DATABASE_URL is correct
- Ensure database allows connections from your deployment platform
- Run `npx prisma migrate deploy` if migrations are pending

### Email Not Sending
- Verify SMTP credentials in DigitalPlat Mail Relay
- Check email logs in DigitalPlat dashboard
- Ensure sender email is authorized

### Content Not Loading
- Verify Stremio addon URLs are accessible
- Check CORS headers on addon responses
- Review server logs for errors

## Rollback

If issues occur:

1. **Frontend**: Redeploy previous version from DigitalPlat Pages dashboard
2. **Backend**: Redeploy previous version from EdgeTerm dashboard
3. **Database**: Restore from backup if needed

## Monitoring

- Check DigitalPlat Analytics for usage stats
- Monitor server logs in EdgeTerm
- Set up uptime monitoring for critical endpoints

## Support

- DigitalPlat Docs: https://docs.digitalplat.org
- EXYO Issues: https://github.com/yourusername/exyo/issues
