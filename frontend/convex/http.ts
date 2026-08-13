import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const PROXY_BASE_URL = "https://exyo.vercel.app";
const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const TMDB_ADDON_URL = "https://94c8cb9f702d-tmdb-addon.baby-beamup.club";

// ─────────────────────────────────────────────────────────────
// Source definitions — ordered by priority (highest first)
// ─────────────────────────────────────────────────────────────
interface AddonDef {
  id: string;
  url: string;
  auth?: string;
  priority: number;
  /** Which resource categories this addon excels at */
  categories: ("metadata" | "catalog" | "stream" | "subtitle")[];
}

const ANIME_ADDON_URL = "https://animestream-addon.keypop3750.workers.dev";

const BUILTIN_ADDONS: AddonDef[] = [
  {
    id: "tmdb",
    url: TMDB_ADDON_URL,
    priority: 10,
    categories: ["metadata", "catalog"],
  },
  {
    id: "cinemeta",
    url: CINEMETA_URL,
    priority: 9,
    categories: ["metadata", "catalog"],
  },
  {
    id: "pengu",
    url: "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
    auth: "Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0",
    priority: 7,
    categories: ["stream"],
  },
  {
    id: "animestream",
    url: ANIME_ADDON_URL,
    priority: 6,
    categories: ["catalog", "stream", "subtitle"],
  },
  {
    id: "flixnest",
    url: "https://free.flixnest.app",
    priority: 5,
    categories: ["catalog", "stream"],
  },
  {
    id: "notorrent",
    url: "https://addon.notorrent2.workers.dev",
    priority: 4,
    categories: ["stream"],
  },
  {
    id: "nuvio",
    url: "https://nuviostreams.hayd.uk",
    priority: 3,
    categories: ["stream"],
  },
  {
    id: "aiocatalogs",
    url: "https://aio.pantelx.com",
    priority: 2,
    categories: ["catalog"],
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
      stillUrl: v.poster || v.thumb,
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
            const timer = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(streamUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) continue;
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("json")) continue;
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

    // Filter to playable + detect codec
    const playable = deduped
      .filter((s: unknown) => {
        const stream = s as Record<string, unknown>;
        return !!(stream.url as string);
      })
      .map((s: unknown) => {
        const stream = s as Record<string, unknown>;
        return { ...stream, codec: detectCodec(stream) };
      });

    return json(playable);
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
        if (value && (!mergedMeta[key] || mergedMeta[key] === "")) {
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
