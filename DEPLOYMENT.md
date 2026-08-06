# EXYO Deployment Guide

## Infrastructure

- **Frontend**: Vercel (https://exyo.cc.cd)
- **Backend + Database**: Convex

## Frontend (Vercel)

### Setup

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables:
   ```
   VITE_API_URL=https://api.exyo.cc.cd/api
   VITE_APP_URL=https://exyo.cc.cd
   VITE_ADDON_URL=https://api.exyo.cc.cd/api/content
   ```
4. Deploy

### Manual Deploy

```bash
cd frontend
vercel --prod
```

## Backend (Convex)

### Setup

1. Install Convex CLI: `npm i -g convex`
2. Run `npx convex dev` to initialize
3. Deploy functions: `npx convex deploy`

## Environment Variables

### Frontend (Vercel)

```
VITE_API_URL=https://api.exyo.cc.cd/api
VITE_APP_URL=https://exyo.cc.cd
VITE_ADDON_URL=https://api.exyo.cc.cd/api/content
```

### Backend (Convex)

Set via Convex dashboard or `npx convex env set`.

## Verification

1. Visit https://exyo.cc.cd
2. Test login/register
