import { Response } from 'express';
import { HistoryService } from '../services/history.service';
import { AuthRequest } from '../types';

export class HistoryController {
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await HistoryService.getHistory(req.userId!, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  }

  static async getContinueWatching(req: AuthRequest, res: Response) {
    try {
      const history = await HistoryService.getContinueWatching(req.userId!);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get continue watching' });
    }
  }

  static async addOrUpdateHistory(req: AuthRequest, res: Response) {
    try {
      const { contentId, title, posterUrl, backdropUrl, contentType, season, episode, progress, addonSource } = req.body;

      if (!contentId || !title || !contentType || progress === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const history = await HistoryService.addOrUpdateHistory(req.userId!, {
        contentId,
        title,
        posterUrl,
        backdropUrl,
        contentType,
        season,
        episode,
        progress,
        addonSource
      });

      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save history' });
    }
  }

  static async updateProgress(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const { progress } = req.body;

      if (progress === undefined) {
        return res.status(400).json({ error: 'Progress is required' });
      }

      const history = await HistoryService.updateProgress(req.userId!, id, progress);
      res.json(history);
    } catch (error: any) {
      if (error.message === 'History item not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }

  static async deleteHistoryItem(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      await HistoryService.deleteHistoryItem(req.userId!, id);
      res.json({ message: 'History item deleted' });
    } catch (error: any) {
      if (error.message === 'History item not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete history item' });
    }
  }

  static async clearHistory(req: AuthRequest, res: Response) {
    try {
      await HistoryService.clearHistory(req.userId!);
      res.json({ message: 'History cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear history' });
    }
  }
}
