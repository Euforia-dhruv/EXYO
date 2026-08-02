import { Response } from 'express';
import { getAuth } from '@clerk/express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const auth = getAuth(req);
      const user = await UserService.getProfile(auth.userId!);
      res.json(user);
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const auth = getAuth(req);
      const user = await UserService.updateProfile(auth.userId!, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.message.includes('already in use')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const auth = getAuth(req);
      const result = await UserService.deleteAccount(auth.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
}
