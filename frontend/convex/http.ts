import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const PROXY_BASE_URL = "https://exyo.vercel.app";

const ALL_ADDON_URLS = [
  CINEMETA_URL,
  "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
  "https://animestream-addon.keypop3750.workers.dev",
  "https://free.flixnest.app",
  "https://addon.notorrent2.workers.dev",
  "https://aio.pantelx.com",
];

const STREAM_ADDON_URLS = [
  "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
  "https://animestream-addon.keypop3750.workers.dev",
  "https://free.flixnest.app",
  "https://addon.notorrent2.workers.dev",
];

function extractAddonAuth(addonUrl: string): string {
  // Extract auth_token from PenguPlay-style addon URLs
  // Format: https://pengu.uk/{%22auth_token%22:%22TOKEN%22}
  try {
    const parsed = new URL(addonUrl);
    const decoded = decodeURIComponent(parsed.pathname + parsed.search);
    const tokenMatch = decoded.match(/auth_token['":\s]+([A-Za-z0-9_-]+)/);
    if (tokenMatch) return tokenMatch[1];
  } catch {}
  return "";
}

function buildProxiedUrl(
  streamUrl: string,
  referer: string,
  addonUrl: string,
): string {
  let proxyUrl = `${PROXY_BASE_URL}/api/proxy?url=${encodeURIComponent(streamUrl)}`;
  if (referer) proxyUrl += `&referer=${encodeURIComponent(referer)}`;

  // Extract auth token from addon URL and forward it
  const auth = extractAddonAuth(addonUrl);
  if (auth) proxyUrl += `&auth=${encodeURIComponent(auth)}`;

  return proxyUrl;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function parseAddonUrls(addonsParam: string | null): string[] {
  if (!addonsParam) return [];
  return addonsParam.split(",").filter(Boolean);
}

function mergeAddonUrls(userAddons: string[]): string[] {
  return [...new Set([...ALL_ADDON_URLS, ...userAddons])];
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

http.route({
  path: "/api/content/:path*",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/api/content/manifests",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const addonsParam = url.searchParams.get("addons");
    const addonUrls = addonsParam ? parseAddonUrls(addonsParam) : ALL_ADDON_URLS;

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const data = await fetchJsonWithTimeout(`${base}/manifest.json`);
        if (!data || typeof data !== "object") return null;
        const m = data as Record<string, unknown>;
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
        };
      })
    );

    const manifests = results
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    return json(manifests);
  }),
});

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
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set<string>();
    const deduped = allMetas.filter((m: unknown) => {
      const meta = m as Record<string, unknown>;
      const key = (meta.id as string) || (meta.imdb_id as string) || "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return json(deduped);
  }),
});

http.route({
  path: "/api/content/search",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "movie";
    const addonsParam = url.searchParams.get("addons");
    if (!q) return json({ error: "Query required" }, 400);

    const userAddonUrls = parseAddonUrls(addonsParam);
    const addonUrls = mergeAddonUrls(userAddonUrls);

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const searchUrl = `${base}/catalog/${type}/top/search=${encodeURIComponent(q)}.json`;
        const data = await fetchJsonWithTimeout(searchUrl);
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

    const allResults = results
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set<string>();
    const deduped = allResults.filter((m: unknown) => {
      const meta = m as Record<string, unknown>;
      const key = (meta.id as string) || (meta.imdb_id as string) || "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return json(deduped);
  }),
});

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
    const streamAddonUrls = [...new Set([...STREAM_ADDON_URLS, ...userAddonUrls])];

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
            for (const s of (data.streams || []) as Record<string, unknown>[]) {
              const streamUrl = s.url as string;
              const behaviorHints = s.behaviorHints as Record<string, unknown> | undefined;
              const proxyHeaders = (behaviorHints as any)?.proxyHeaders?.request;
              const referer = proxyHeaders?.Referer || proxyHeaders?.referer || "";
              const proxiedUrl = streamUrl
                ? buildProxiedUrl(streamUrl, referer, addonUrl)
                : undefined;
              allStreams.push({
                ...s,
                addonName: addonUrl.split("/")[2] || addonUrl,
                addonUrl: base,
                proxiedUrl,
              });
            }
          } catch {
            continue;
          }
        }
        return allStreams;
      })
    );

    const allStreams = results
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set<string>();
    const deduped = allStreams.filter((s: unknown) => {
      const stream = s as Record<string, unknown>;
      const key = (stream.url as string) || (stream.infoHash as string) || "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const playable = deduped.filter((s: unknown) => {
      const stream = s as Record<string, unknown>;
      const url = (stream.url as string) || "";
      if (!url) return false;
      return true;
    }).map((s: unknown) => {
      const stream = s as Record<string, unknown>;
      const title = ((stream.title as string) || "").toLowerCase();
      const desc = ((stream.description as string) || "").toLowerCase();
      const name = ((stream.name as string) || "").toLowerCase();
      const combined = `${title} ${desc} ${name}`;
      let codec = "h264";
      if (combined.includes("hevc") || combined.includes("h.265") || combined.includes("x265")) {
        codec = "hevc";
      } else if (combined.includes("av1") || combined.includes("av01")) {
        codec = "av1";
      } else if (combined.includes("h.264") || combined.includes("avc") || combined.includes("x264")) {
        codec = "h264";
      }
      return { ...stream, codec };
    });

    return json(playable);
  }),
});

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
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set<string>();
    const deduped = allSubs.filter((s: unknown) => {
      const sub = s as Record<string, unknown>;
      const key = ((sub.url as string) || "") + ((sub.lang as string) || "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return json(deduped);
  }),
});

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
    const addonUrls = mergeAddonUrls(userAddonUrls);

    const seriesId = id.includes(":") ? id.split(":")[0] : id;

    const typesToTry = type === "anime" ? ["anime", "series"] : [type];

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
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

    const addonResults = results
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value as { meta: Record<string, unknown>; addonUrl: string; addonName: string });

    if (addonResults.length === 0) {
      return json({ error: "Not found" }, 404);
    }

    const primary = addonResults[0];
    const meta = primary.meta;

    if (id.includes(":") && meta.videos) {
      const parts = id.split(":");
      const seasonNum = parseInt(parts[1]);
      const epNum = parseInt(parts[2]);
      const episode = (meta.videos as Array<Record<string, unknown>>).find(
        (v) => v.season === seasonNum && (v.number === epNum || v.episode === epNum)
      );
      if (episode) {
        return json({
          ...meta,
          ...episode,
          id: id,
          type: "series",
          name: `${meta.name} — S${String(seasonNum).padStart(2, "0")}E${String(epNum).padStart(2, "0")} ${episode.name || ""}`,
          background: meta.background || meta.poster,
        });
      }
    }

    const episodes = extractMetaVideos(meta, seriesId);
    if (episodes) {
      meta.episodes = episodes;
    }

    const normalized: Record<string, unknown> = {
      ...meta,
      backdropUrl: meta.background || meta.poster || meta.backgroundImage || null,
      posterUrl: meta.poster || meta.background || null,
    };

    return json(normalized);
  }),
});

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
      if (auth) {
        // Forward auth token as cookie for addons like PenguPlay
        headers.Cookie = `auth_token=${auth}`;
      }
      const range = request.headers.get("Range");
      if (range) headers.Range = range;

      const upstream = await fetch(target, { headers, method: request.method });
      if (!upstream.ok) return new Response(null, { status: upstream.status });

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const upstreamStatus = upstream.status as number;

      if (target.endsWith(".m3u8") || contentType.includes("mpegurl") || contentType.includes("m3u8")) {
        const text = await upstream.text();
        const base = new URL(target);
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

http.route({
  path: "/api/proxy",
  method: "HEAD",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    const referer = url.searchParams.get("referer") || "";
    const auth = url.searchParams.get("auth") || "";
    if (!target) return new Response(null, { status: 400 });

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      };
      if (referer) headers.Referer = referer;
      if (auth) headers.Cookie = `auth_token=${auth}`;

      const upstream = await fetch(target, { method: "HEAD", headers });
      if (!upstream.ok) return new Response(null, { status: upstream.status });

      const respHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      };

      const contentLength = upstream.headers.get("content-length");
      if (contentLength) respHeaders["Content-Length"] = contentLength;

      const acceptRanges = upstream.headers.get("accept-ranges");
      if (acceptRanges) respHeaders["Accept-Ranges"] = acceptRanges;

      return new Response(null, { status: upstream.status, headers: respHeaders });
    } catch (err: any) {
      return new Response(null, { status: 502 });
    }
  }),
});

export default http;
