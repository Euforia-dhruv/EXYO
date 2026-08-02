import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.userId = auth.userId;
  next();
};
