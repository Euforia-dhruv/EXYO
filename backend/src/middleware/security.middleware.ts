import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

export const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many stream requests' },
  standardHeaders: true,
  legacyHeaders: false
});

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
};
