import { Request, Response } from 'express';
import { AddonService } from '../services/addon.service';

const DEFAULT_ADDONS: Record<string, string> = {
  cinemeta: 'https://v3-cinemeta.strem.io',
  torrentio: 'https://torrentio.strem.fun'
};

const qs = (val: unknown, fallback: string): string => {
  if (val === undefined || val === null) return fallback;
  return String(val);
};

export class ContentController {
  static async getCatalogs(req: Request, res: Response) {
    try {
      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'cinemeta')] || qs(req.query.addon, 'cinemeta');
      const type = qs(req.query.type, 'movie');
      const catalogId = qs(req.query.catalogId, 'top');

      const catalogs = await AddonService.getCatalogs(addonUrl, type, catalogId);
      res.json(catalogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch catalogs' });
    }
  }

  static async searchContent(req: Request, res: Response) {
    try {
      const q = req.query.q;
      if (!q) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'cinemeta')] || qs(req.query.addon, 'cinemeta');
      const type = qs(req.query.type, 'movie');
      const results = await AddonService.search(addonUrl, type, String(q));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  static async getContentDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'cinemeta')] || qs(req.query.addon, 'cinemeta');
      const type = qs(req.query.type, 'movie');
      const url = `${addonUrl}/${type}/${id}.json`;

      const response = await fetch(url);
      if (!response.ok) {
        res.status(404).json({ error: 'Content not found' });
        return;
      }

      const data: any = await response.json();
      res.json(data.meta || data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content details' });
    }
  }

  static async getStreams(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'torrentio')] || qs(req.query.addon, 'torrentio');
      const type = qs(req.query.type, 'movie');
      const streams = await AddonService.getStreams(addonUrl, type, id);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch streams' });
    }
  }

  static async getSubtitles(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'cinemeta')] || qs(req.query.addon, 'cinemeta');
      const type = qs(req.query.type, 'movie');
      const subtitles = await AddonService.getSubtitles(addonUrl, type, id);
      res.json(subtitles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
  }

  static async getManifest(req: Request, res: Response) {
    try {
      const addonUrl = DEFAULT_ADDONS[qs(req.query.addon, 'cinemeta')] || qs(req.query.addon, 'cinemeta');
      const manifest = await AddonService.getManifest(addonUrl);
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch manifest' });
    }
  }
}
