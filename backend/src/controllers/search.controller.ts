import { Response } from 'express';
import { SearchService } from '../services/search.service';
import { AuthRequest } from '../types';

export class SearchController {
  static async getSearchHistory(req: AuthRequest, res: Response) {
    try {
      const history = await SearchService.getSearchHistory(req.userId!);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get search history' });
    }
  }

  static async saveSearch(req: AuthRequest, res: Response) {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const search = await SearchService.saveSearch(req.userId!, query);
      res.json(search);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save search' });
    }
  }

  static async clearSearchHistory(req: AuthRequest, res: Response) {
    try {
      await SearchService.clearSearchHistory(req.userId!);
      res.json({ message: 'Search history cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear search history' });
    }
  }
}
