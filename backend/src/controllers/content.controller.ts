import { Response } from 'express';
import { AddonService } from '../services/addon.service';
import { UserAddonService } from '../services/user-addon.service';
import { AuthRequest } from '../types';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const TORRENTIO_URL = 'https://torrentio.strem.fun';

const qs = (val: unknown, fallback: string): string => {
  if (val === undefined || val === null) return fallback;
  return String(val);
};

export class ContentController {
  static async getCatalogs(req: AuthRequest, res: Response) {
    try {
      const type = qs(req.query.type, 'movie');
      const catalogId = qs(req.query.catalogId, 'top');

      let addonUrl = CINEMETA_URL;

      if (req.userId) {
        try {
          const addons = await UserAddonService.getAddons(req.userId);
          const catalogAddon = addons.find(
            (a) => a.active && a.manifest && (a.manifest as any).catalogs?.some((c: any) => c.type === type)
          );
          if (catalogAddon) {
            addonUrl = catalogAddon.url.replace('/manifest.json', '');
          }
        } catch {
          // Fall back to default
        }
      }

      const catalogs = await AddonService.getCatalogs(addonUrl, type, catalogId);
      res.json(catalogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch catalogs' });
    }
  }

  static async searchContent(req: AuthRequest, res: Response) {
    try {
      const q = req.query.q;
      if (!q) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const type = qs(req.query.type, 'movie');

      let addonUrl = CINEMETA_URL;

      if (req.userId) {
        try {
          const addons = await UserAddonService.getAddons(req.userId);
          const catalogAddon = addons.find(
            (a) => a.active && a.manifest && (a.manifest as any).catalogs?.some((c: any) => c.type === type)
          );
          if (catalogAddon) {
            addonUrl = catalogAddon.url.replace('/manifest.json', '');
          }
        } catch {
          // Fall back to default
        }
      }

      const results = await AddonService.search(addonUrl, type, String(q));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  static async getContentDetails(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const type = qs(req.query.type, 'movie');

      let addonUrl = CINEMETA_URL;

      if (req.userId) {
        try {
          const addons = await UserAddonService.getAddons(req.userId);
          const catalogAddon = addons.find(
            (a) => a.active && a.manifest && (a.manifest as any).catalogs?.some((c: any) => c.type === type)
          );
          if (catalogAddon) {
            addonUrl = catalogAddon.url.replace('/manifest.json', '');
          }
        } catch {
          // Fall back to default
        }
      }

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

  static async getStreams(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const type = qs(req.query.type, 'movie');

      let addonUrl = TORRENTIO_URL;

      if (req.userId) {
        try {
          const addons = await UserAddonService.getAddons(req.userId);
          const streamAddon = addons.find(
            (a) => a.active && a.manifest && (a.manifest as any).resources?.some((r: any) =>
              typeof r === 'string' ? r === 'stream' : r.name === 'stream'
            )
          );
          if (streamAddon) {
            addonUrl = streamAddon.url.replace('/manifest.json', '');
          }
        } catch {
          // Fall back to default
        }
      }

      const streams = await AddonService.getStreams(addonUrl, type, id);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch streams' });
    }
  }

  static async getSubtitles(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const type = qs(req.query.type, 'movie');

      let addonUrl = CINEMETA_URL;

      if (req.userId) {
        try {
          const addons = await UserAddonService.getAddons(req.userId);
          const subtitleAddon = addons.find(
            (a) => a.active && a.manifest && (a.manifest as any).resources?.some((r: any) =>
              typeof r === 'string' ? r === 'subtitles' : r.name === 'subtitles'
            )
          );
          if (subtitleAddon) {
            addonUrl = subtitleAddon.url.replace('/manifest.json', '');
          }
        } catch {
          // Fall back to default
        }
      }

      const subtitles = await AddonService.getSubtitles(addonUrl, type, id);
      res.json(subtitles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
  }

  static async getManifest(req: AuthRequest, res: Response) {
    try {
      const addonUrl = qs(req.query.addon, CINEMETA_URL);
      const manifest = await AddonService.getManifest(addonUrl);
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch manifest' });
    }
  }
}
