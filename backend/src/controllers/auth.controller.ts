import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const result = await AuthService.register({ username, email, password });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes('already')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await AuthService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await AuthService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const result = await AuthService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
