import type { ContentItem, ContentType, Stream, StreamType, Subtitle } from "../types";

// ─────────────────────────────────────────────────────────────
// Normalize Stremio meta object → ContentItem
// ─────────────────────────────────────────────────────────────
export function normalizeMetaToContentItem(
  meta: Record<string, unknown>,
  sourceId: string,
  fallbackType: ContentType = "movie"
): ContentItem {
  const rawType = (meta.type as string) || fallbackType;
  const type = normalizeContentType(rawType);

  return {
    id: (meta.id as string) || (meta.imdb_id as string) || "",
    type,
    title: (meta.name as string) || (meta.title as string) || "",
    year: (meta.releaseInfo as string) || (meta.year as string) || undefined,
    poster: (meta.poster as string) || (meta.posterUrl as string) || undefined,
    backdrop: (meta.background as string) || (meta.backdrop as string) || (meta.backgroundImage as string) || undefined,
    description: (meta.description as string) || undefined,
    genres: Array.isArray(meta.genres) ? (meta.genres as string[]) : Array.isArray(meta.genre) ? (meta.genre as string[]) : undefined,
    rating: meta.imdbRating ? Number(meta.imdbRating) : (meta.rating as number) || undefined,
    runtime: meta.runtime ? String(meta.runtime) : undefined,
    cast: Array.isArray(meta.cast) ? (meta.cast as string[]) : undefined,
    sourceId,
    sourceItemId: (meta.id as string) || "",
    imdbId: (meta.imdb_id as string) || (meta.imdbId as string) || undefined,
    tmdbId: (meta.tmdb_id as string) || (meta.tmdbId as string) || undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Normalize Stremio stream object → Stream
// ─────────────────────────────────────────────────────────────
export function normalizeStream(
  raw: Record<string, unknown>,
  sourceId: string,
  addonName?: string,
  addonUrl?: string
): Stream {
  const url = (raw.url as string) || "";
  const infoHash = (raw.infoHash as string) || undefined;
  const type = detectStreamType(url, infoHash);
  const quality = extractQuality(raw);
  const codec = detectCodec(raw);

  return {
    id: url || infoHash || `stream-${Math.random().toString(36).slice(2)}`,
    sourceId,
    title: (raw.title as string) || (raw.name as string) || undefined,
    name: (raw.name as string) || undefined,
    url: url || undefined,
    infoHash,
    type,
    quality,
    codec,
    language: (raw.language as string) || undefined,
    headers: raw.headers as Record<string, string> | undefined,
    behaviorHints: raw.behaviorHints as Stream["behaviorHints"],
    addonName,
    addonUrl,
  };
}

// ─────────────────────────────────────────────────────────────
// Normalize Stremio subtitle object → Subtitle
// ─────────────────────────────────────────────────────────────
export function normalizeSubtitle(
  raw: Record<string, unknown>,
  sourceId: string
): Subtitle {
  return {
    id: (raw.url as string) + (raw.lang as string) || `sub-${Math.random().toString(36).slice(2)}`,
    sourceId,
    url: (raw.url as string) || "",
    language: (raw.lang as string) || "en",
    label: (raw.label as string) || (raw.lang as string) || "English",
    format: (raw.format as string) || undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
export function normalizeContentType(raw: string): ContentType {
  const lower = raw.toLowerCase();
  if (lower === "anime") return "anime";
  if (lower === "series" || lower === "tv") return "series";
  return "movie";
}

function detectStreamType(url: string, infoHash?: string): StreamType {
  if (infoHash) return "torrent";
  if (!url) return "external";
  const lower = url.toLowerCase();
  if (lower.includes(".m3u8") || lower.includes("mpegurl")) return "hls";
  if (lower.includes(".mp4")) return "mp4";
  if (lower.includes(".mpd") || lower.includes("dash")) return "dash";
  return "mp4"; // default assumption for direct URLs
}

function extractQuality(raw: Record<string, unknown>): string | undefined {
  const title = ((raw.title as string) || "").toLowerCase();
  const desc = ((raw.description as string) || "").toLowerCase();
  const name = ((raw.name as string) || "").toLowerCase();
  const combined = `${title} ${desc} ${name}`;

  if (combined.includes("2160") || combined.includes("4k")) return "2160p";
  if (combined.includes("1080")) return "1080p";
  if (combined.includes("720")) return "720p";
  if (combined.includes("480")) return "480p";
  if (combined.includes("360")) return "360p";

  // Try to extract from quality field
  const quality = raw.quality as string | undefined;
  if (quality) return quality;

  return undefined;
}

function detectCodec(raw: Record<string, unknown>): string | undefined {
  const title = ((raw.title as string) || "").toLowerCase();
  const desc = ((raw.description as string) || "").toLowerCase();
  const name = ((raw.name as string) || "").toLowerCase();
  const combined = `${title} ${desc} ${name}`;

  if (combined.includes("hevc") || combined.includes("h.265") || combined.includes("x265")) return "hevc";
  if (combined.includes("av1") || combined.includes("av01")) return "av1";
  if (combined.includes("h.264") || combined.includes("avc") || combined.includes("x264")) return "h264";
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Deduplication
// ─────────────────────────────────────────────────────────────
export function dedupeContentItems(items: ContentItem[]): ContentItem[] {
  const seen = new Map<string, ContentItem>();

  for (const item of items) {
    // Build dedup key from multiple signals
    const keys: string[] = [];
    if (item.imdbId) keys.push(`imdb:${item.imdbId}`);
    if (item.tmdbId) keys.push(`tmdb:${item.tmdbId}`);
    if (item.id) keys.push(`id:${item.id}`);
    if (item.title && item.year) keys.push(`titleyear:${item.title.toLowerCase()}:${item.year}`);

    // Find existing match
    let merged = false;
    for (const key of keys) {
      const existing = seen.get(key);
      if (existing) {
        // Merge: prefer non-empty fields from new item
        for (const [k, v] of Object.entries(item)) {
          if (v && !(existing as unknown as Record<string, unknown>)[k]) {
            (existing as unknown as Record<string, unknown>)[k] = v;
          }
        }
        // Ensure all dedup keys point to the same item
        for (const k of keys) seen.set(k, existing);
        merged = true;
        break;
      }
    }

    if (!merged && keys.length > 0) {
      for (const key of keys) seen.set(key, item);
    } else if (!merged && keys.length === 0) {
      // No identifiable key — keep as-is with a unique entry
      seen.set(`unknown:${Math.random().toString(36).slice(2)}`, item);
    }
  }

  // Deduplicate by source+sourceItemId as final pass
  const finalSeen = new Set<string>();
  return Array.from(new Set(seen.values())).filter((item) => {
    const key = `${item.sourceId}:${item.sourceItemId}`;
    if (finalSeen.has(key)) return false;
    finalSeen.add(key);
    return true;
  });
}

export function dedupeStreams(streams: Stream[]): Stream[] {
  const seen = new Set<string>();
  return streams.filter((s) => {
    const key = s.url || s.infoHash || s.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeSubtitles(subs: Subtitle[]): Subtitle[] {
  const seen = new Set<string>();
  return subs.filter((s) => {
    const key = s.url + s.language;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Ranking
// ─────────────────────────────────────────────────────────────
const QUALITY_RANK: Record<string, number> = {
  "2160p": 5, "4k": 5, "1080p": 4, "720p": 3, "480p": 2, "360p": 1,
};

function rankQuality(q?: string): number {
  if (!q) return 0;
  return QUALITY_RANK[q.toLowerCase()] ?? 0;
}

function codecRank(s: Stream): number {
  const c = (s.codec || "").toLowerCase();
  if (c === "h264" || c === "avc") return 3;
  if (c === "vp9" || c === "vp8" || c === "av1") return 2;
  if (c === "hevc" || c === "h265") return 1;
  return 0;
}

export function rankStreams(streams: Stream[], sourcePriority: Record<string, number> = {}): Stream[] {
  return [...streams].sort((a, b) => {
    // Prefer direct playable URLs over torrents
    const aPlayable = a.url && !a.infoHash ? 1 : 0;
    const bPlayable = b.url && !b.infoHash ? 1 : 0;
    if (aPlayable !== bPlayable) return bPlayable - aPlayable;

    // Codec compatibility
    const cd = codecRank(b) - codecRank(a);
    if (cd !== 0) return cd;

    // Quality
    const qd = rankQuality(b.quality) - rankQuality(a.quality);
    if (qd !== 0) return qd;

    // Source priority
    const ap = sourcePriority[a.sourceId] ?? 0;
    const bp = sourcePriority[b.sourceId] ?? 0;
    if (ap !== bp) return bp - ap;

    return 0;
  });
}

export function rankContentItems(items: ContentItem[], sourcePriority: Record<string, number> = {}): ContentItem[] {
  const typePriority: Record<string, number> = { movie: 0, series: 1, anime: 2 };
  return [...items].sort((a, b) => {
    // Type priority
    const tp = (typePriority[a.type] ?? 1) - (typePriority[b.type] ?? 1);
    if (tp !== 0) return tp;

    // Poster availability
    const ap = a.poster ? 1 : 0;
    const bp = b.poster ? 1 : 0;
    if (ap !== bp) return bp - ap;

    // Rating
    const ar = a.rating ?? 0;
    const br = b.rating ?? 0;
    if (ar !== br) return br - ar;

    // Source priority
    const as = sourcePriority[a.sourceId] ?? 0;
    const bs = sourcePriority[b.sourceId] ?? 0;
    if (as !== bs) return bs - as;

    return 0;
  });
}
