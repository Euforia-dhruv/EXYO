# EXYO - Netflix Clone with Stremio Integration

A production-ready streaming platform that looks and feels like Netflix, powered by Stremio addons for unlimited content.

![EXYO Logo](frontend/public/logo-Photoroom.png)

## Live Demo

- **Frontend**: https://exyo.cc.cd

## Features

- **User Authentication**: Google OAuth via Convex
- **Netflix-like UI**: Dark theme, horizontal scrolling rows, hover effects
- **Watch History**: Track viewing progress across devices
- **My List**: Save movies and shows to watch later
- **Search**: Full-text search with history
- **Stremio Integration**: Access content from Torrentio, Cinemeta, and more
- **Video Player**: Custom player with HLS support, subtitles, quality selection
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Share Functionality**: Share content via clipboard or native share

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Router v7
- HLS.js
- Convex (Backend + Database + Auth)
- Vercel (Hosting)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/exyo.git
cd exyo

# 2. Setup Frontend
cd frontend
npm install
cp .env.local.example .env.local  # set VITE_CONVEX_URL, VITE_GOOGLE_CLIENT_ID
npm run dev

# 3. Start Convex (separate terminal)
cd frontend
npx convex dev
```

## Environment Variables

### Frontend (.env.local)

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APP_URL=https://exyo.cc.cd
```

## Project Structure

```
exyo/
├── frontend/
│   ├── convex/          # Convex backend functions
│   │   ├── http.ts      # HTTP routes (content API, proxy)
│   │   ├── users.ts     # User management
│   │   ├── watchHistory.ts
│   │   ├── watchlist.ts
│   │   ├── searchHistory.ts
│   │   ├── addons.ts
│   │   └── schema.ts    # Database schema
│   ├── src/
│   │   ├── api/         # API services
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   ├── stores/      # Zustand store
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── .github/workflows/   # CI/CD
├── DEPLOYMENT.md
└── README.md
```

## License

MIT
