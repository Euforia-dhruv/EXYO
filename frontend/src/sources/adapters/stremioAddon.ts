import type {
  ContentSource,
  ContentItem,
  ContentDetails,
  ContentType,
  EpisodeItem,
  SourceCapabilities,
  SourceManifest,
  Stream,
  Subtitle,
} from "../types";
import {
  normalizeMetaToContentItem,
  normalizeStream,
  normalizeSubtitle,
} from "../utils/normalize";

// ─────────────────────────────────────────────────────────────
// Generic Stremio Addon Adapter
// Wraps any Stremio-compatible addon behind a uniform interface
// ─────────────────────────────────────────────────────────────
export class StremioAddonAdapter implements ContentSource {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  capabilities: SourceCapabilities = {
    catalogs: false,
    search: false,
    details: false,
    streams: false,
    subtitles: false,
  };

  private _manifest: SourceManifest | null = null;
  private _timeoutMs: number;
  private _auth?: string;

  constructor(opts: {
    id: string;
    name?: string;
    baseUrl: string;
    enabled?: boolean;
    priority?: number;
    timeout?: number;
    auth?: string;
  }) {
    this.id = opts.id;
    this.name = opts.name || opts.id;
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.enabled = opts.enabled ?? true;
    this.priority = opts.priority ?? 0;
    this._timeoutMs = opts.timeout ?? 8000;
    this._auth = opts.auth;
  }

  // ── Manifest ──────────────────────────────────────────────
  async getManifest(): Promise<SourceManifest | null> {
    if (this._manifest) return this._manifest;
    try {
      const data = await this.fetchJson(`${this.baseUrl}/manifest.json`);
      if (!data || typeof data !== "object") return null;
      const m = data as Record<string, unknown>;
      this._manifest = {
        id: (m.id as string) || this.baseUrl,
        name: (m.name as string) || this.name,
        description: m.description as string | undefined,
        version: m.version as string | undefined,
        types: Array.isArray(m.types) ? (m.types as string[]) : undefined,
        catalogs: Array.isArray(m.catalogs)
          ? (m.catalogs as Array<Record<string, unknown>>).map((c) => ({
              type: c.type as string,
              id: c.id as string,
              name: (c.name as string) || (c.id as string),
              extra: Array.isArray(c.extra)
                ? (c.extra as Array<Record<string, unknown>>).map((e) => ({
                    name: e.name as string,
                    isRequired: e.isRequired as boolean | undefined,
                  }))
                : undefined,
            }))
          : undefined,
        resources: m.resources as SourceManifest["resources"],
        logo: m.logo as string | undefined,
        behaviorHints: m.behaviorHints as Record<string, unknown> | undefined,
      };

      // Infer capabilities from manifest
      const resources = m.resources as Array<string | Record<string, unknown>> | undefined;
      if (resources) {
        for (const r of resources) {
          const name = typeof r === "string" ? r : (r.name as string);
          if (name === "catalog") this.capabilities.catalogs = true;
          if (name === "meta") this.capabilities.details = true;
          if (name === "stream") this.capabilities.streams = true;
          if (name === "subtitles") this.capabilities.subtitles = true;
        }
      }

      // Infer search from catalog extra props
      if (this._manifest.catalogs) {
        for (const cat of this._manifest.catalogs) {
          if (cat.extra?.some((e) => e.name === "search")) {
            this.capabilities.search = true;
            break;
          }
        }
      }

      return this._manifest;
    } catch {
      return null;
    }
  }

  // ── Catalog ───────────────────────────────────────────────
  async getCatalog(type: ContentType, catalogId: string): Promise<ContentItem[]> {
    const tryTypes = type === "anime" ? ["anime", "series"] : [type];
    const results: ContentItem[] = [];

    for (const t of tryTypes) {
      try {
        const url = `${this.baseUrl}/catalog/${t}/${catalogId}.json`;
        const data = await this.fetchJson(url);
        if (!data || typeof data !== "object") continue;
        const metas = (data as Record<string, unknown>).metas;
        if (!Array.isArray(metas)) continue;
        for (const m of metas) {
          results.push(
            normalizeMetaToContentItem(m as Record<string, unknown>, this.id, type)
          );
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  // ── Search ────────────────────────────────────────────────
  async search(query: string, type?: ContentType): Promise<ContentItem[]> {
    const typesToSearch = type
      ? type === "anime"
        ? ["anime", "series"]
        : [type]
      : ["movie", "series"];

    const results: ContentItem[] = [];

    const searchPromises = typesToSearch.flatMap((searchType) =>
      this.searchForType(query, searchType, type || "movie")
    );

    const settled = await Promise.allSettled(searchPromises);
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(...r.value);
    }

    return results;
  }

  private async searchForType(
    query: string,
    searchType: string,
    fallbackType: ContentType
  ): Promise<ContentItem[]> {
    try {
      // Standard Stremio search endpoint
      const url = `${this.baseUrl}/catalog/${searchType}/top/search=${encodeURIComponent(query)}.json`;
      const data = await this.fetchJson(url);
      if (!data || typeof data !== "object") return [];
      const metas = (data as Record<string, unknown>).metas;
      if (!Array.isArray(metas)) return [];
      return metas.map((m) =>
        normalizeMetaToContentItem(m as Record<string, unknown>, this.id, fallbackType)
      );
    } catch {
      return [];
    }
  }

  // ── Details ───────────────────────────────────────────────
  async getDetails(id: string, type: ContentType): Promise<ContentDetails | null> {
    const tryTypes = type === "anime" ? ["anime", "series"] : [type];

    for (const t of tryTypes) {
      try {
        const url = `${this.baseUrl}/meta/${t}/${id}.json`;
        const data = await this.fetchJson(url);
        if (!data || typeof data !== "object") continue;
        const raw = data as Record<string, unknown>;
        const meta = (raw.meta as Record<string, unknown>) || raw;
        if (!meta || !meta.name) continue;

        const item = normalizeMetaToContentItem(meta, this.id, type);
        const episodes = this.extractEpisodes(meta, id);
        return { ...item, episodes };
      } catch {
        continue;
      }
    }

    return null;
  }

  private extractEpisodes(meta: Record<string, unknown>, baseId: string): EpisodeItem[] | undefined {
    const videos = meta.videos as Array<Record<string, unknown>> | undefined;
    if (!videos || !Array.isArray(videos)) return undefined;

    return videos
      .filter((v) => v.type === "episode" || v.season)
      .map((v) => ({
        id: `${baseId}:${v.season}:${v.number || v.episode}`,
        videoId: `${baseId}:${v.season}:${v.number || v.episode}`,
        name: (v.name as string) || `S${v.season}E${v.number || v.episode}`,
        title: (v.name as string) || undefined,
        episodeNumber: (v.number as number) || (v.episode as number) || 0,
        seasonNumber: (v.season as number) || 0,
        description: (v.description as string) || undefined,
        runtime: v.runtime ? Number(v.runtime) : undefined,
        rating: v.imdbRating ? Number(v.imdbRating) : undefined,
        stillUrl: (v.poster as string) || (v.thumb as string) || undefined,
      }));
  }

  // ── Streams ───────────────────────────────────────────────
  async getStreams(id: string, type: ContentType): Promise<Stream[]> {
    const tryTypes = type === "anime" ? ["anime", "series"] : [type];
    const results: Stream[] = [];

    for (const t of tryTypes) {
      try {
        const url = `${this.baseUrl}/stream/${t}/${id}.json`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this._timeoutMs);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("json")) continue;
        const data = await res.json();
        const streams = data.streams as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(streams)) continue;

        for (const s of streams) {
          results.push(
            normalizeStream(s, this.id, this.name, this.baseUrl)
          );
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  // ── Subtitles ─────────────────────────────────────────────
  async getSubtitles(id: string, type: ContentType): Promise<Subtitle[]> {
    const tryTypes = type === "anime" ? ["anime", "series"] : [type];
    const results: Subtitle[] = [];

    for (const t of tryTypes) {
      try {
        const url = `${this.baseUrl}/subtitles/${t}/${id}.json`;
        const data = await this.fetchJson(url);
        if (!data || typeof data !== "object") continue;
        const subs = (data as Record<string, unknown>).subtitles;
        if (!Array.isArray(subs)) continue;
        for (const s of subs) {
          results.push(normalizeSubtitle(s as Record<string, unknown>, this.id));
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  // ── Internal fetch ────────────────────────────────────────
  private async fetchJson(url: string): Promise<unknown | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this._timeoutMs);
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this._auth) {
        headers.Cookie = `auth_token=${this._auth}`;
      }
      const res = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
