# EXYO Deployment Guide

## Infrastructure

- **Frontend**: Vercel (https://exyo.cc.cd)
- **Backend**: Convex
- **Database**: Railway PostgreSQL

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

## Database (Railway)

### Setup

1. Create Railway account
2. Add PostgreSQL service
3. Copy connection string
4. Set `DATABASE_URL` in backend environment

### Run Migrations

```bash
cd backend
npx prisma migrate deploy
```

## Environment Variables

### Backend

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
CORS_ORIGIN=https://exyo.cc.cd
STREMIO_DEFAULT_ADDON=https://v3-cinemeta.strem.io
TORRENTIO_ADDON=https://torrentio.strem.fun
```

### Frontend

```
VITE_API_URL=https://api.exyo.cc.cd/api
VITE_APP_URL=https://exyo.cc.cd
VITE_ADDON_URL=https://api.exyo.cc.cd/api/content
```

## Verification

1. Visit https://exyo.cc.cd
2. Test login/register
3. Verify API health: `curl https://api.exyo.cc.cd/api/health`

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGIN` matches frontend URL
- Check for trailing slashes

### Database Connection
- Verify `DATABASE_URL` is correct
- Run `npx prisma migrate deploy` if migrations pending
