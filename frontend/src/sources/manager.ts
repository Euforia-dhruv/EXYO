import type {
  ContentSource,
  ContentItem,
  ContentDetails,
  ContentType,
  SourceManifest,
  Stream,
  Subtitle,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Stremio Addon Manager
// Loads, manages, and queries a collection of Stremio addons
// ─────────────────────────────────────────────────────────────
export interface ManagedAddon {
  source: ContentSource;
  healthy: boolean;
  lastHealthCheck: number;
  latencyMs: number;
}

export class SourceManager {
  private _sources: Map<string, ContentSource> = new Map();
  private _health: Map<string, { healthy: boolean; lastChecked: number; latencyMs: number }> = new Map();

  // ── Register / Unregister ─────────────────────────────────
  addSource(source: ContentSource): void {
    this._sources.set(source.id, source);
  }

  removeSource(id: string): void {
    this._sources.delete(id);
    this._health.delete(id);
  }

  getSource(id: string): ContentSource | undefined {
    return this._sources.get(id);
  }

  getEnabledSources(): ContentSource[] {
    return Array.from(this._sources.values())
      .filter((s) => s.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  getAllSources(): ContentSource[] {
    return Array.from(this._sources.values());
  }

  // ── Parallel catalog fetch ────────────────────────────────
  async getCatalogs(
    type: ContentType,
    catalogId: string
  ): Promise<ContentItem[]> {
    const sources = this.getEnabledSources().filter(
      (s) => s.capabilities.catalogs && s.getCatalog
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const start = Date.now();
        try {
          const items = await s.getCatalog!(type, catalogId);
          this.recordHealth(s.id, true, Date.now() - start);
          return items;
        } catch {
          this.recordHealth(s.id, false, Date.now() - start);
          return [];
        }
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<ContentItem[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }

  // ── Parallel search ───────────────────────────────────────
  async search(
    query: string,
    type?: ContentType
  ): Promise<ContentItem[]> {
    const sources = this.getEnabledSources().filter(
      (s) => s.capabilities.search && s.search
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const start = Date.now();
        try {
          const items = await s.search!(query, type);
          this.recordHealth(s.id, true, Date.now() - start);
          return items;
        } catch {
          this.recordHealth(s.id, false, Date.now() - start);
          return [];
        }
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<ContentItem[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }

  // ── Parallel details ──────────────────────────────────────
  async getDetails(
    id: string,
    type: ContentType
  ): Promise<ContentDetails | null> {
    const sources = this.getEnabledSources().filter(
      (s) => s.capabilities.details && s.getDetails
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const start = Date.now();
        try {
          const details = await s.getDetails!(id, type);
          this.recordHealth(s.id, true, Date.now() - start);
          return details;
        } catch {
          this.recordHealth(s.id, false, Date.now() - start);
          return null;
        }
      })
    );

    const valid = results
      .filter((r): r is PromiseFulfilledResult<ContentDetails | null> =>
        r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value!);

    if (valid.length === 0) return null;

    // Merge metadata from all sources
    return this.mergeDetails(valid);
  }

  // ── Parallel streams ──────────────────────────────────────
  async getStreams(
    id: string,
    type: ContentType
  ): Promise<Stream[]> {
    const sources = this.getEnabledSources().filter(
      (s) => s.capabilities.streams && s.getStreams
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const start = Date.now();
        try {
          const streams = await s.getStreams!(id, type);
          this.recordHealth(s.id, true, Date.now() - start);
          return streams;
        } catch {
          this.recordHealth(s.id, false, Date.now() - start);
          return [];
        }
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Stream[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }

  // ── Parallel subtitles ────────────────────────────────────
  async getSubtitles(
    id: string,
    type: ContentType
  ): Promise<Subtitle[]> {
    const sources = this.getEnabledSources().filter(
      (s) => s.capabilities.subtitles && s.getSubtitles
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const start = Date.now();
        try {
          const subs = await s.getSubtitles!(id, type);
          this.recordHealth(s.id, true, Date.now() - start);
          return subs;
        } catch {
          this.recordHealth(s.id, false, Date.now() - start);
          return [];
        }
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Subtitle[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }

  // ── Manifests ─────────────────────────────────────────────
  async getManifests(): Promise<SourceManifest[]> {
    const sources = this.getEnabledSources().filter(
      (s) => s.getManifest
    );

    const results = await Promise.allSettled(
      sources.map(async (s) => {
        try {
          const manifest = await s.getManifest!();
          if (manifest) {
            return {
              ...manifest,
              addonUrl: s.baseUrl,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    return results
      .filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<SourceManifest | null>).value !== null)
      .map((r) => (r as PromiseFulfilledResult<SourceManifest | null>).value!);
  }

  // ── Health ────────────────────────────────────────────────
  private recordHealth(sourceId: string, healthy: boolean, latencyMs: number): void {
    this._health.set(sourceId, { healthy, lastChecked: Date.now(), latencyMs });
  }

  getHealth(sourceId: string) {
    return this._health.get(sourceId);
  }

  getAllHealth() {
    return Array.from(this._health.entries()).map(([sourceId, h]) => ({
      sourceId,
      ...h,
    }));
  }

  // ── Merge details from multiple sources ───────────────────
  private mergeDetails(details: ContentDetails[]): ContentDetails {
    const merged = { ...details[0] };
    for (let i = 1; i < details.length; i++) {
      const d = details[i];
      // Prefer non-empty fields
      for (const [key, value] of Object.entries(d)) {
        if (value && !(merged as Record<string, unknown>)[key]) {
          (merged as Record<string, unknown>)[key] = value;
        }
      }
      // Merge episodes if both have them
      if (d.episodes && merged.episodes) {
        const existingIds = new Set(merged.episodes.map((e: { id: string }) => e.id));
        for (const ep of d.episodes) {
          if (!existingIds.has(ep.id)) {
            merged.episodes.push(ep);
          }
        }
      } else if (d.episodes && !merged.episodes) {
        merged.episodes = d.episodes;
      }
    }
    return merged;
  }
}
