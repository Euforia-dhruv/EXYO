import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.getProfile(req.userId!);
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
      const user = await UserService.updateProfile(req.userId!, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.message.includes('already in use')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const result = await UserService.changePassword(req.userId!, { currentPassword, newPassword });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to change password' });
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.deleteAccount(req.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
}
