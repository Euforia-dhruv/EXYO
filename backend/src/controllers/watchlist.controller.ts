import { Response } from 'express';
import { WatchlistService } from '../services/watchlist.service';
import { AuthRequest } from '../types';

export class WatchlistController {
  static async getWatchlist(req: AuthRequest, res: Response) {
    try {
      const watchlist = await WatchlistService.getWatchlist(req.userId!);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get watchlist' });
    }
  }

  static async addToWatchlist(req: AuthRequest, res: Response) {
    try {
      const { contentId, title, posterUrl, backdropUrl, contentType } = req.body;

      if (!contentId || !title || !contentType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const item = await WatchlistService.addToWatchlist(req.userId!, {
        contentId,
        title,
        posterUrl,
        backdropUrl,
        contentType
      });

      res.status(201).json(item);
    } catch (error: any) {
      if (error.message === 'Already in watchlist') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add to watchlist' });
    }
  }

  static async removeFromWatchlist(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      await WatchlistService.removeFromWatchlist(req.userId!, id);
      res.json({ message: 'Removed from watchlist' });
    } catch (error: any) {
      if (error.message === 'Watchlist item not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  }

  static async checkWatchlist(req: AuthRequest, res: Response) {
    try {
      const contentId = String(req.params.contentId);
      const isInWatchlist = await WatchlistService.isInWatchlist(req.userId!, contentId);
      res.json({ isInWatchlist });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check watchlist' });
    }
  }
}
