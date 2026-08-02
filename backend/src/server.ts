import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware } from '@clerk/express';
import userRoutes from './routes/user.routes';
import historyRoutes from './routes/history.routes';
import watchlistRoutes from './routes/watchlist.routes';
import searchRoutes from './routes/search.routes';
import contentRoutes from './routes/content.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { securityHeaders, requestLogger, apiLimiter } from './middleware/security.middleware';
import { corsConfig } from './config/cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

export const prisma = new PrismaClient();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsConfig));
app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());
app.use(securityHeaders);
app.use(requestLogger);

app.use('/api', apiLimiter);

app.use('/api/user', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/search-history', searchRoutes);
app.use('/api/content', contentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`EXYO Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
