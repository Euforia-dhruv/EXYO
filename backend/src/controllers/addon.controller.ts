import { Response } from 'express';
import { UserAddonService } from '../services/user-addon.service';
import { AuthRequest } from '../types';

export class AddonController {
  static async getAddons(req: AuthRequest, res: Response) {
    try {
      const addons = await UserAddonService.getAddons(req.userId!);
      res.json(addons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get addons' });
    }
  }

  static async addAddon(req: AuthRequest, res: Response) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const addon = await UserAddonService.addAddon(req.userId!, url);
      res.status(201).json({ success: true, addon });
    } catch (error: any) {
      if (error.message === 'Addon already added') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add addon' });
    }
  }

  static async removeAddon(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      await UserAddonService.removeAddon(req.userId!, id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Addon not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Cannot remove default addons') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to remove addon' });
    }
  }

  static async toggleAddon(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const addon = await UserAddonService.toggleAddon(req.userId!, id);
      res.json(addon);
    } catch (error: any) {
      if (error.message === 'Addon not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Cannot toggle default addons') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to toggle addon' });
    }
  }
}
