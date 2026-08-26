import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const PROXY_BASE_URL = "https://exyo.cc.cd";
const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const TMDB_ADDON_URL = "https://94c8cb9f702d-tmdb-addon.baby-beamup.club";

// ─── Free embed providers (no API key needed) ────────────────
interface EmbedProvider {
  name: string;
  getStreams(tmdbId: string, type: string, season?: number, episode?: number): Promise<unknown[]>;
}

async function encryptVidlink(tmdbId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://enc-dec.app/api/enc-vidlink?text=${encodeURIComponent(tmdbId)}`);
    const data = await res.json() as Record<string, unknown>;
    return (data.result as string) || null;
  } catch { return null; }
}

async function getVidlinkStreams(tmdbId: string, type: string, season?: number, episode?: number): Promise<unknown[]> {
  const encoded = await encryptVidlink(tmdbId);
  if (!encoded) return [];
  const path = type === 'tv' && season && episode
    ? `/api/b/tv/${encoded}/${season}/${episode}`
    : `/api/b/movie/${encoded}`;
  const res = await fetch(`https://vidlink.pro${path}?multiLang=0`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://vidlink.pro' },
  });
  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>;
  const stream = data.stream as Record<string, unknown> | undefined;
  if (!stream?.qualities) return [];
  const qualities = stream.qualities as Record<string, { url: string }>;
  return Object.entries(qualities)
    .filter(([, v]) => v?.url)
    .map(([q, v]) => ({
      url: v.url,
      name: 'VidLink',
      title: `VidLink ${q}p`,
      quality: q === '4k' ? '2160p' : `${q}p`,
      addonName: 'VidLink',
    }));
}

async function getEmbedSuStreams(tmdbId: string, type: string): Promise<unknown[]> {
  const id = type === 'tv' ? `tv/${tmdbId}` : `movie/${tmdbId}`;
  const res = await fetch(`https://www.embed.su/embed/${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const iframeSrc = html.match(/src="(https?:\/\/[^"]*embed[^"]*)"/)?.[1];
  if (!iframeSrc) return [];
  // The embed page itself serves as a playable iframe
  return [{
    url: iframeSrc,
    name: 'Embed.su',
    title: 'Embed.su Stream',
    quality: '1080p',
    addonName: 'Embed.su',
  }];
}

async function getVidfastStreams(tmdbId: string, type: string): Promise<unknown[]> {
  const path = type === 'tv' ? `tv/${tmdbId}` : `movie/${tmdbId}`;
  return [{
    url: `https://vidfast.vc/${path}`,
    name: 'VidFast',
    title: 'VidFast Stream',
    quality: '1080p',
    addonName: 'VidFast',
  }];
}

interface AddonDef {
  id: string;
  url: string;
  auth?: string;
  priority: number;
  categories: ("metadata" | "catalog" | "stream" | "subtitle")[];
}

const BUILTIN_ADDONS: AddonDef[] = [
  {
    id: "torrentio",
    url: "https://torrentio.strem.fun",
    priority: 10,
    categories: ["stream"],
  },
  {
    id: "hdhub",
    url: "https://hdhub.thevolecitor.qzz.io",
    priority: 9,
    categories: ["stream"],
  },
  {
    id: "meteor",
    url: "https://meteorfortheweebs.midnightignite.me",
    priority: 8,
    categories: ["stream"],
  },
  {
    id: "torrentsdb",
    url: "https://torrentsdb.com",
    priority: 7,
    categories: ["stream"],
  },
  {
    id: "pengu",
    url: "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
    auth: "Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0",
    priority: 6,
    categories: ["stream"],
  },
  {
    id: "tmdb",
    url: TMDB_ADDON_URL,
    priority: 5,
    categories: ["metadata", "catalog"],
  },
  {
    id: "cinemeta",
    url: CINEMETA_URL,
    priority: 4,
    categories: ["metadata", "catalog"],
  },
];

function getAddonByUrl(url: string): AddonDef | undefined {
  const base = url.replace(/\/$/, "");
  return BUILTIN_ADDONS.find((a) => a.url.replace(/\/$/, "") === base);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function extractAddonAuth(addonUrl: string): string {
  try {
    const parsed = new URL(addonUrl);
    const decoded = decodeURIComponent(parsed.pathname + parsed.search);
    const tokenMatch = decoded.match(/auth_token['":\s]+([A-Za-z0-9_-]+)/);
    if (tokenMatch) return tokenMatch[1];
  } catch {}
  return "";
}

function buildProxiedUrl(streamUrl: string, referer: string, addonUrl: string): string {
  let proxyUrl = `${PROXY_BASE_URL}/api/proxy?url=${encodeURIComponent(streamUrl)}`;
  if (referer) proxyUrl += `&referer=${encodeURIComponent(referer)}`;
  const auth = extractAddonAuth(addonUrl);
  if (auth) proxyUrl += `&auth=${encodeURIComponent(auth)}`;
  return proxyUrl;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200, cacheControl?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...corsHeaders };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(data), { status, headers });
}

function parseAddonUrls(addonsParam: string | null): string[] {
  if (!addonsParam) return [];
  return addonsParam.split(",").filter(Boolean);
}

function mergeAddonUrls(userAddons: string[]): string[] {
  return [...new Set([...BUILTIN_ADDONS.map((a) => a.url), ...userAddons])];
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function resolveRedirect(url: string, addonUrl?: string, timeoutMs = 5000): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    };
    const auth = addonUrl ? extractAddonAuth(addonUrl) : "";
    if (auth) headers.Cookie = `auth_token=${auth}`;
    const res = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal, headers });
    clearTimeout(timer);
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) return location.startsWith("http") ? location : new URL(location, url).href;
    }
    return url;
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────────────────────
// Deduplication
// ─────────────────────────────────────────────────────────────

function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function metaKey(meta: Record<string, unknown>): string {
  return (meta.id as string) || (meta.imdb_id as string) || "";
}

function streamKey(stream: Record<string, unknown>): string {
  return (stream.url as string) || (stream.infoHash as string) || "";
}

function subtitleKey(sub: Record<string, unknown>): string {
  return ((sub.url as string) || "") + ((sub.lang as string) || "");
}

// ─────────────────────────────────────────────────────────────
// Content extraction helpers
// ─────────────────────────────────────────────────────────────

function extractCatalogsFromManifest(manifest: Record<string, unknown>, addonBase: string) {
  const catalogs = manifest.catalogs as Array<Record<string, unknown>> | undefined;
  if (!catalogs || !Array.isArray(catalogs)) return [];
  return catalogs.map((c) => ({
    ...c,
    addonUrl: addonBase,
    addonName: manifest.name || addonBase,
  }));
}

function extractMetaVideos(meta: Record<string, unknown>, baseId: string) {
  const videos = meta.videos as Array<Record<string, unknown>> | undefined;
  if (!videos || !Array.isArray(videos)) return null;
  return videos
    .filter((v) => v.type === "episode" || v.season)
    .map((v) => ({
      id: `${baseId}:${v.season}:${v.number || v.episode}`,
      videoId: `${baseId}:${v.season}:${v.number || v.episode}`,
      name: v.name,
      title: v.name,
      episodeNumber: v.number || v.episode,
      seasonNumber: v.season,
      description: v.description || "",
      runtime: v.runtime,
      rating: v.imdbRating ? Number(v.imdbRating) : undefined,
      stillUrl: v.still || v.stillUrl || v.thumbnail || v.image || v.poster || v.thumb,
    }));
}

function detectCodec(stream: Record<string, unknown>): string {
  const title = ((stream.title as string) || "").toLowerCase();
  const desc = ((stream.description as string) || "").toLowerCase();
  const name = ((stream.name as string) || "").toLowerCase();
  const combined = `${title} ${desc} ${name}`;
  if (combined.includes("hevc") || combined.includes("h.265") || combined.includes("x265")) return "hevc";
  if (combined.includes("av1") || combined.includes("av01")) return "av1";
  return "h264";
}

function detectQuality(stream: Record<string, unknown>): string {
  const title = ((stream.title as string) || "").toLowerCase();
  const desc = ((stream.description as string) || "").toLowerCase();
  const name = ((stream.name as string) || "").toLowerCase();
  const combined = `${title} ${desc} ${name}`;
  if (combined.includes("2160") || combined.includes("4k")) return "2160p";
  if (combined.includes("1080")) return "1080p";
  if (combined.includes("720")) return "720p";
  if (combined.includes("480")) return "480p";
  if (combined.includes("360")) return "360p";
  return "";
}

const QUALITY_RANK: Record<string, number> = {
  "2160p": 5, "4k": 5, "1080p": 4, "720p": 3, "480p": 2, "360p": 1,
};

function sortStreamsByQuality(streams: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...streams].sort((a, b) => {
    const aUrl = (a.url as string) || '';
    const bUrl = (b.url as string) || '';
    const aIsHls = aUrl.includes('.m3u8') || aUrl.includes('mpegurl');
    const bIsHls = bUrl.includes('.m3u8') || bUrl.includes('mpegurl');

    // HLS streams first (most likely to play in browser)
    if (aIsHls !== bIsHls) return aIsHls ? -1 : 1;

    // Then any URL streams over torrent-only
    const aPlayable = aUrl.startsWith('http') ? 1 : 0;
    const bPlayable = bUrl.startsWith('http') ? 1 : 0;
    if (aPlayable !== bPlayable) return bPlayable - aPlayable;

    // Then by quality
    const aQuality = detectQuality(a);
    const bQuality = detectQuality(b);
    const aRank = QUALITY_RANK[aQuality] ?? 0;
    const bRank = QUALITY_RANK[bQuality] ?? 0;
    return bRank - aRank;
  });
}

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

http.route({
  path: "/api/content/:path*",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

// ── Manifests ───────────────────────────────────────────────
http.route({
  path: "/api/content/manifests",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const addonsParam = url.searchParams.get("addons");
    const userUrls = parseAddonUrls(addonsParam);
    const allUrls = addonsParam ? mergeAddonUrls(userUrls) : BUILTIN_ADDONS.map((a) => a.url);

    const results = await Promise.allSettled(
      allUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const data = await fetchJsonWithTimeout(`${base}/manifest.json`);
        if (!data || typeof data !== "object") return null;
        const m = data as Record<string, unknown>;
        const def = getAddonByUrl(addonUrl);
        return {
          id: m.id || base,
          name: m.name || base,
          description: m.description || "",
          version: m.version || "",
          types: m.types || [],
          catalogs: extractCatalogsFromManifest(m, base),
          resources: m.resources || [],
          logo: m.logo || "",
          behaviorHints: m.behaviorHints || {},
          addonUrl: base,
          priority: def?.priority ?? 0,
        };
      })
    );

    const manifests = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    return json(manifests);
  }),
});

// ── Catalogs ────────────────────────────────────────────────
http.route({
  path: "/api/content/catalogs",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "movie";
    const catalogId = url.searchParams.get("catalogId") || "trending";
    const addonsParam = url.searchParams.get("addons");
    const userAddonUrls = parseAddonUrls(addonsParam);
    const addonUrls = mergeAddonUrls(userAddonUrls);

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const catalogUrl = `${base}/catalog/${type}/${catalogId}.json`;
        const data = await fetchJsonWithTimeout(catalogUrl);
        if (!data || typeof data !== "object") return [];
        const metas = (data as Record<string, unknown>).metas;
        if (!Array.isArray(metas)) return [];
        return metas.map((m: Record<string, unknown>) => ({
          ...m,
          addonUrl: base,
          addonName: addonUrl.split("/")[2] || base,
        }));
      })
    );

    const allMetas = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value);

    const deduped = dedupeByKey(allMetas, (m) => metaKey(m as Record<string, unknown>));

    return json(deduped, 200, "public, max-age=300");
  }),
});

// ── Search ──────────────────────────────────────────────────
http.route({
  path: "/api/content/search",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const type = url.searchParams.get("type");
    const addonsParam = url.searchParams.get("addons");
    if (!q) return json({ error: "Query required" }, 400);

    const userAddonUrls = parseAddonUrls(addonsParam);
    const allAddonUrls = mergeAddonUrls(userAddonUrls);

    const typesToSearch = type ? [type] : ["movie", "series", "anime"];

    const results = await Promise.allSettled(
      allAddonUrls.flatMap((addonUrl) =>
        typesToSearch.map(async (searchType) => {
          const base = addonUrl.replace(/\/$/, "");
          const searchUrl = `${base}/catalog/${searchType}/top/search=${encodeURIComponent(q)}.json`;
          const data = await fetchJsonWithTimeout(searchUrl);
          if (!data || typeof data !== "object") return [];
          const metas = (data as Record<string, unknown>).metas;
          if (!Array.isArray(metas)) return [];
          return metas.map((m: Record<string, unknown>) => ({
            ...m,
            type: searchType,
            addonUrl: base,
            addonName: addonUrl.split("/")[2] || base,
          }));
        })
      )
    );

    const allResults = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value);

    const deduped = dedupeByKey(allResults, (m) => metaKey(m as Record<string, unknown>));

    return json(deduped);
  }),
});

// ── Single manifest ─────────────────────────────────────────
http.route({
  path: "/api/content/manifest",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const addon = url.searchParams.get("addon") || CINEMETA_URL;
    try {
      const res = await fetch(`${addon}/manifest.json`);
      return json(await res.json());
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

// ── Streams ─────────────────────────────────────────────────
http.route({
  path: "/api/content/streams",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "movie";
    const addonsParam = url.searchParams.get("addons");
    if (!id) return json({ error: "id required" }, 400);

    const userAddonUrls = parseAddonUrls(addonsParam);
    const streamAddonUrls = [...new Set([...BUILTIN_ADDONS.filter((a) => a.categories.includes("stream")).map((a) => a.url), ...userAddonUrls])];

    const typesToTry = type === "anime" ? ["anime", "series"] : [type];

    const results = await Promise.allSettled(
      streamAddonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const allStreams: Record<string, unknown>[] = [];
        for (const tryType of typesToTry) {
          const streamUrl = `${base}/stream/${tryType}/${id}.json`;
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15000);
            const res = await fetch(streamUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) continue;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("html") || contentType.includes("xml")) continue;
            const data = await res.json();
            const allStreamData: Array<{ s: Record<string, unknown>; rawUrl: string; referer: string }> = [];
            for (const s of (data.streams || []) as Record<string, unknown>[]) {
              const rawUrl = s.url as string;
              const behaviorHints = s.behaviorHints as Record<string, unknown> | undefined;
              const proxyHeaders = (behaviorHints as any)?.proxyHeaders?.request;
              const referer = proxyHeaders?.Referer || proxyHeaders?.referer || "";
              allStreamData.push({ s, rawUrl, referer });
            }

            // Resolve redirects in parallel
            const resolved = await Promise.all(
              allStreamData.map(async (item) => {
                const resolvedUrl = item.rawUrl ? await resolveRedirect(item.rawUrl, addonUrl) : item.rawUrl;
                const proxiedUrl = resolvedUrl
                  ? buildProxiedUrl(resolvedUrl, item.referer, addonUrl)
                  : undefined;
                return {
                  ...item.s,
                  url: resolvedUrl,
                  addonName: addonUrl.split("/")[2] || addonUrl,
                  addonUrl: base,
                  proxiedUrl,
                };
              })
            );
            allStreams.push(...resolved);
          } catch {
            continue;
          }
        }
        return allStreams;
      })
    );

    const allStreams = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value);

    // Dedupe by URL/infoHash
    const deduped = dedupeByKey(allStreams, (s) => streamKey(s as Record<string, unknown>));

    // Filter to playable (URL or torrent infoHash) + detect codec + detect quality + sort by quality
    const playable = deduped
      .filter((s: unknown) => {
        const stream = s as Record<string, unknown>;
        return !!(stream.url as string) || !!(stream.infoHash as string);
      })
      .map((s: unknown) => {
        const stream = s as Record<string, unknown>;
        return { ...stream, codec: detectCodec(stream), quality: detectQuality(stream) };
      });

    return json(sortStreamsByQuality(playable));
  }),
});

// ── Single addon stream ─────────────────────────────────────
http.route({
  path: "/api/content/stream",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "movie";
    const addon = url.searchParams.get("addon");
    if (!id || !addon) return json({ error: "id and addon required" }, 400);

    try {
      const base = addon.replace(/\/$/, "");
      const streamUrl = `${base}/stream/${type}/${id}.json`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(streamUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return json({ error: "Addon returned error" }, res.status);
      const data = await res.json();
      const streams = (data.streams || []).map((s: Record<string, unknown>) => {
        const streamUrl = s.url as string;
        const behaviorHints = s.behaviorHints as Record<string, unknown> | undefined;
        const proxyHeaders = (behaviorHints as any)?.proxyHeaders?.request;
        const referer = proxyHeaders?.Referer || proxyHeaders?.referer || "";
        const proxiedUrl = streamUrl
          ? buildProxiedUrl(streamUrl, referer, addon)
          : undefined;
        return {
          ...s,
          addonName: addon.split("/")[2] || addon,
          addonUrl: base,
          proxiedUrl,
        };
      });
      return json(streams);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

// ── Subtitles ───────────────────────────────────────────────
http.route({
  path: "/api/content/subtitles",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "movie";
    const addonsParam = url.searchParams.get("addons");
    if (!id) return json([], 400);

    const userAddonUrls = parseAddonUrls(addonsParam);
    const addonUrls = mergeAddonUrls(userAddonUrls);

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const subUrl = `${base}/subtitles/${type}/${id}.json`;
        const data = await fetchJsonWithTimeout(subUrl);
        if (!data || typeof data !== "object") return [];
        const subtitles = (data as Record<string, unknown>).subtitles;
        if (!Array.isArray(subtitles)) return [];
        return subtitles.map((s: Record<string, unknown>) => ({
          ...s,
          addonName: addonUrl.split("/")[2] || base,
        }));
      })
    );

    const allSubs = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value);

    const deduped = dedupeByKey(allSubs, (s) => subtitleKey(s as Record<string, unknown>));

    return json(deduped);
  }),
});

// ── Free embed streams (VidLink, Embed.su, VidFast) ─────────
http.route({
  path: "/api/content/embeds",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id"); // TMDB ID
    const type = url.searchParams.get("type") || "movie";
    const season = url.searchParams.get("season") ? parseInt(url.searchParams.get("season")!) : undefined;
    const episode = url.searchParams.get("episode") ? parseInt(url.searchParams.get("episode")!) : undefined;

    if (!id) return json({ error: "TMDB id required" }, 400);

    // Extract numeric TMDB ID if prefixed with "tt"
    const tmdbId = id.startsWith("tt") ? id.replace("tt", "") : id;

    const results = await Promise.allSettled([
      getVidlinkStreams(tmdbId, type, season, episode),
      getEmbedSuStreams(tmdbId, type),
      getVidfastStreams(tmdbId, type),
    ]);

    const allStreams = results
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    return json(allStreams);
  }),
});

http.route({
  path: "/api/content/embeds",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

// ── Details ─────────────────────────────────────────────────
http.route({
  path: "/api/content/details",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "movie";
    const addonsParam = url.searchParams.get("addons");
    if (!id) return json({ error: "id required" }, 400);

    const userAddonUrls = parseAddonUrls(addonsParam);
    const seriesId = id.includes(":") ? id.split(":")[0] : id;
    const typesToTry = type === "anime" ? ["anime", "series"] : [type];

    // Phase 1: Try metadata-rich addons first (TMDB, Cinemeta) — fast, good data
    const metadataUrls = [...new Set([...BUILTIN_ADDONS.filter((a) => a.categories.includes("metadata")).map((a) => a.url), ...userAddonUrls])];
    const metadataResults = await Promise.allSettled(
      metadataUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        for (const tryType of typesToTry) {
          const metaUrl = `${base}/meta/${tryType}/${seriesId}.json`;
          const data = await fetchJsonWithTimeout(metaUrl);
          if (!data || typeof data !== "object") continue;
          const raw = data as Record<string, unknown>;
          const meta = (raw.meta as Record<string, unknown>) || raw;
          if (!meta || !meta.name) continue;
          return { meta, addonUrl: base, addonName: addonUrl.split("/")[2] || base, resolvedType: tryType };
        }
        return null;
      })
    );

    const metadataAddonResults = metadataResults
      .filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<unknown>).value !== null)
      .map((r) => (r as PromiseFulfilledResult<unknown>).value as { meta: Record<string, unknown>; addonUrl: string; addonName: string });

    // Phase 2: If no metadata found, try all remaining addons
    let addonResults = metadataAddonResults;
    if (addonResults.length === 0) {
      const allUrls = [...new Set([...BUILTIN_ADDONS.map((a) => a.url), ...userAddonUrls])];
      const allResults = await Promise.allSettled(
        allUrls.map(async (addonUrl) => {
          const base = addonUrl.replace(/\/$/, "");
          for (const tryType of typesToTry) {
            const metaUrl = `${base}/meta/${tryType}/${seriesId}.json`;
            const data = await fetchJsonWithTimeout(metaUrl);
            if (!data || typeof data !== "object") continue;
            const raw = data as Record<string, unknown>;
            const meta = (raw.meta as Record<string, unknown>) || raw;
            if (!meta || !meta.name) continue;
            return { meta, addonUrl: base, addonName: addonUrl.split("/")[2] || base, resolvedType: tryType };
          }
          return null;
        })
      );
      addonResults = allResults
        .filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<unknown>).value !== null)
        .map((r) => (r as PromiseFulfilledResult<unknown>).value as { meta: Record<string, unknown>; addonUrl: string; addonName: string });
    }

    if (addonResults.length === 0) {
      return json({ error: "Not found" }, 404);
    }

    // Merge metadata from multiple addons for richer data
    let mergedMeta: Record<string, unknown> = {};
    for (const result of addonResults) {
      const m = result.meta;
      for (const [key, value] of Object.entries(m)) {
        if (key === "videos" && Array.isArray(value) && mergedMeta.videos) {
          // Merge videos arrays: enrich episode entries with thumbnails from all addons
          const existing = mergedMeta.videos as Array<Record<string, unknown>>;
          const incoming = value as Array<Record<string, unknown>>;
          for (const incomingEp of incoming) {
            const matchIdx = existing.findIndex(
              (e) => e.season === incomingEp.season && (e.number === incomingEp.number || e.episode === incomingEp.episode)
            );
            if (matchIdx >= 0) {
              // Enrich existing episode with missing fields (especially thumbnails)
              const ep = existing[matchIdx];
              for (const [ek, ev] of Object.entries(incomingEp)) {
                if (ev && (!ep[ek] || ep[ek] === "")) {
                  ep[ek] = ev;
                }
              }
            } else {
              existing.push(incomingEp);
            }
          }
        } else if (value && (!mergedMeta[key] || mergedMeta[key] === "")) {
          mergedMeta[key] = value;
        }
      }
    }

    // For series episode requests, extract the specific episode
    if (id.includes(":") && mergedMeta.videos) {
      const parts = id.split(":");
      const seasonNum = parseInt(parts[1]);
      const epNum = parseInt(parts[2]);
      const episode = (mergedMeta.videos as Array<Record<string, unknown>>).find(
        (v) => v.season === seasonNum && (v.number === epNum || v.episode === epNum)
      );
      if (episode) {
        return json({
          ...mergedMeta,
          ...episode,
          id: id,
          type: "series",
          name: `${mergedMeta.name} — S${String(seasonNum).padStart(2, "0")}E${String(epNum).padStart(2, "0")} ${episode.name || ""}`,
          background: mergedMeta.background || mergedMeta.poster,
        });
      }
    }

    const episodes = extractMetaVideos(mergedMeta, seriesId);
    if (episodes) {
      mergedMeta.episodes = episodes;
    }

    const normalized: Record<string, unknown> = {
      ...mergedMeta,
      backdropUrl: mergedMeta.background || mergedMeta.poster || mergedMeta.backgroundImage || null,
      posterUrl: mergedMeta.poster || mergedMeta.background || null,
    };

    return json(normalized, 200, "public, max-age=600");
  }),
});

// ── Proxy ───────────────────────────────────────────────────
http.route({
  path: "/api/proxy",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    const referer = url.searchParams.get("referer") || "";
    const auth = url.searchParams.get("auth") || "";
    if (!target) return new Response("url required", { status: 400 });

    const proxyOrigin = url.origin;

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      };
      if (referer) headers.Referer = referer;
      if (auth) headers.Cookie = `auth_token=${auth}`;
      const range = request.headers.get("Range");
      if (range) headers.Range = range;

      // Manually follow redirects to preserve headers across hops
      let currentUrl = target;
      let upstream;
      for (let i = 0; i < 5; i++) {
        upstream = await fetch(currentUrl, { headers, method: request.method, redirect: "manual" });
        if (upstream.status >= 300 && upstream.status < 400) {
          const location = upstream.headers.get("location");
          if (location) {
            currentUrl = location.startsWith("http") ? location : new URL(location, currentUrl).href;
            continue;
          }
        }
        break;
      }
      if (!upstream || !upstream.ok) return new Response(null, { status: upstream?.status || 502 });

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const upstreamStatus = upstream.status as number;

      if (currentUrl.endsWith(".m3u8") || target.endsWith(".m3u8") || contentType.includes("mpegurl") || contentType.includes("m3u8")) {
        const text = await upstream.text();
        const base = new URL(currentUrl);
        const rewritten = text.split("\n").map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
              const abs = new URL(uri, base).href;
              return `URI="${proxyOrigin}/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}"`;
            });
          }
          const abs = new URL(trimmed, base).href;
          return `${proxyOrigin}/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}`;
        }).join("\n");

        return new Response(rewritten, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache",
          },
        });
      }

      const respHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      };

      const contentLength = upstream.headers.get("content-length");
      if (contentLength) respHeaders["Content-Length"] = contentLength;

      const contentRange = upstream.headers.get("content-range");
      if (contentRange) respHeaders["Content-Range"] = contentRange;

      const acceptRanges = upstream.headers.get("accept-ranges");
      if (acceptRanges) respHeaders["Accept-Ranges"] = acceptRanges;

      return new Response(upstream.body, { status: upstreamStatus, headers: respHeaders });
    } catch (err: any) {
      return new Response("proxy error: " + err.message, { status: 502 });
    }
  }),
});

http.route({
  path: "/api/proxy",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

export default http;
