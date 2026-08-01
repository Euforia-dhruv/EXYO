import NodeCache from 'node-cache';
import { AddonManifest, CatalogItem, Stream } from '../types';

const cache = new NodeCache({ stdTTL: 3600 });

export class AddonService {
  private static async fetchJSON<T>(url: string): Promise<T> {
    const cached = cache.get<T>(url);
    if (cached) {
      return cached;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${url}`);
    }

    const data = await response.json() as T;
    cache.set(url, data);
    return data;
  }

  static async getManifest(addonUrl: string): Promise<AddonManifest> {
    const url = `${addonUrl}/manifest.json`;
    return this.fetchJSON<AddonManifest>(url);
  }

  static async getCatalogs(addonUrl: string, type: string, catalogId: string): Promise<CatalogItem[]> {
    const url = `${addonUrl}/catalog/${type}/${catalogId}.json`;
    const data = await this.fetchJSON<{ metas: CatalogItem[] }>(url);
    return data.metas || [];
  }

  static async search(addonUrl: string, type: string, query: string): Promise<CatalogItem[]> {
    const url = `${addonUrl}/catalog/${type}/top/search=${encodeURIComponent(query)}.json`;
    const data = await this.fetchJSON<{ metas: CatalogItem[] }>(url);
    return data.metas || [];
  }

  static async getStreams(addonUrl: string, type: string, id: string): Promise<Stream[]> {
    const url = `${addonUrl}/stream/${type}/${id}.json`;
    const data = await this.fetchJSON<{ streams: Stream[] }>(url);
    return data.streams || [];
  }

  static async getSubtitles(addonUrl: string, type: string, id: string): Promise<any[]> {
    try {
      const url = `${addonUrl}/subtitles/${type}/${id}.json`;
      const data = await this.fetchJSON<{ subtitles: any[] }>(url);
      return data.subtitles || [];
    } catch {
      return [];
    }
  }
}
