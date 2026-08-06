# EXYO - Netflix Clone with Stremio Integration

A production-ready streaming platform that looks and feels like Netflix, powered by Stremio addons for unlimited content.

![EXYO Logo](frontend/public/logo-Photoroom.png)

## Live Demo

- **Frontend**: https://exyo.cc.cd
- **API**: Backend API (deployed separately)

## Features

- **User Authentication**: JWT-based auth with login, register, password reset
- **Netflix-like UI**: Dark theme, horizontal scrolling rows, hover effects
- **Watch History**: Track viewing progress across devices
- **My List**: Save movies and shows to watch later
- **Search**: Full-text search with history
- **Stremio Integration**: Access content from Torrentio, Cinemeta, and more
- **Video Player**: Custom player with HLS support, subtitles, quality selection
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Share Functionality**: Share content via clipboard or native share

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Router v6
- HLS.js

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt

### Infrastructure
- Vercel (Frontend)
- Convex (Backend + Database)

## Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/exyo.git
cd exyo

# 2. Start database
docker-compose up -d postgres redis

# 3. Setup Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev

# 4. Setup Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

### History
- `GET /api/history` - Get watch history
- `GET /api/history/continue-watching` - Get continue watching
- `POST /api/history` - Save/update progress

### Watchlist
- `GET /api/watchlist` - Get watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist

### Content
- `GET /api/content/catalogs` - Get catalogs
- `GET /api/content/search?q=` - Search content
- `GET /api/content/:id` - Get content details
- `GET /api/content/:id/streams` - Get streams

## Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exyo"
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

## Project Structure

```
exyo/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/       # API services
│   │   ├── components/# Reusable components
│   │   ├── hooks/     # Custom hooks
│   │   ├── pages/     # Page components
│   │   ├── store/     # Zustand store
│   │   ├── types/     # TypeScript types
│   │   └── utils/     # Utilities
│   └── package.json
│
├── backend/           # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── config/      # Configuration
│   │   ├── middleware/  # Auth, validation
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── types/       # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
│
├── .github/workflows/ # CI/CD
├── docker-compose.yml # Docker setup
├── DEPLOYMENT.md      # Deployment guide
└── README.md
```

## License

MIT
