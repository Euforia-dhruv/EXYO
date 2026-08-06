import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
