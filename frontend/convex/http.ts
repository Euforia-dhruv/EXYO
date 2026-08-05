import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const PROXY_BASE_URL = "https://exyo.vercel.app";

const DEFAULT_STREAM_ADDONS = [
  "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
  "https://animestream-addon.keypop3750.workers.dev",
  "https://free.flixnest.app",
];

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



http.route({
  path: "/api/content/:path*",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/api/content/catalogs",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "movie";
    const catalogId = url.searchParams.get("catalogId") || "trending";

    try {
      const res = await fetch(`${CINEMETA_URL}/catalog/${type}/${catalogId}.json`);
      if (!res.ok) return json({ error: "Failed to fetch" }, res.status);
      const data = await res.json();
      return json(data.metas || []);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

http.route({
  path: "/api/content/search",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "movie";
    if (!q) return json({ error: "Query required" }, 400);

    try {
      const res = await fetch(`${CINEMETA_URL}/catalog/${type}/top/search=${encodeURIComponent(q)}.json`);
      if (!res.ok) return json({ error: "Search failed" }, res.status);
      const data = await res.json();
      return json(data.metas || []);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
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

    const userAddonUrls = addonsParam
      ? addonsParam.split(",").filter(Boolean)
      : [];

    const addonUrls = [...new Set([...DEFAULT_STREAM_ADDONS, ...userAddonUrls])];

    const results = await Promise.allSettled(
      addonUrls.map(async (addonUrl) => {
        const base = addonUrl.replace(/\/$/, "");
        const streamUrl = `${base}/stream/${type}/${id}.json`;
        const res = await fetch(streamUrl);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.streams || []).map((s: Record<string, unknown>) => {
          const streamUrl = s.url as string;
          const behaviorHints = s.behaviorHints as Record<string, unknown> | undefined;
          const proxyHeaders = (behaviorHints as any)?.proxyHeaders?.request;
          const referer = proxyHeaders?.Referer || proxyHeaders?.referer || "";
          const proxiedUrl = streamUrl
            ? `${PROXY_BASE_URL}/api/proxy?url=${encodeURIComponent(streamUrl)}${referer ? `&referer=${encodeURIComponent(referer)}` : ""}`
            : undefined;
          return {
            ...s,
            addonName: addonUrl.split("/")[2] || addonUrl,
            addonUrl: base,
            proxiedUrl,
          };
        });
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
      const res = await fetch(streamUrl);
      if (!res.ok) return json({ error: "Addon returned error" }, res.status);
      const data = await res.json();
      const streams = (data.streams || []).map((s: Record<string, unknown>) => {
        const streamUrl = s.url as string;
        const behaviorHints = s.behaviorHints as Record<string, unknown> | undefined;
        const proxyHeaders = (behaviorHints as any)?.proxyHeaders?.request;
        const referer = proxyHeaders?.Referer || proxyHeaders?.referer || "";
        const proxiedUrl = streamUrl
          ? `${PROXY_BASE_URL}/api/proxy?url=${encodeURIComponent(streamUrl)}${referer ? `&referer=${encodeURIComponent(referer)}` : ""}`
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
    if (!id) return json([], 400);

    try {
      // For episode IDs like "tt0944947:1:1", try the full ID first, then fallback to series ID
      const res = await fetch(`${CINEMETA_URL}/meta/subtitles/${type}/${id}.json`);
      if (res.ok) {
        const data = await res.json();
        return json(data.subtitles || []);
      }
      // Fallback: try with base series ID
      if (id.includes(":")) {
        const seriesId = id.split(":")[0];
        const fallback = await fetch(`${CINEMETA_URL}/meta/subtitles/${type}/${seriesId}.json`);
        if (fallback.ok) {
          const data = await fallback.json();
          return json(data.subtitles || []);
        }
      }
      return json([]);
    } catch {
      return json([]);
    }
  }),
});

http.route({
  path: "/api/content/details",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "movie";
    if (!id) return json({ error: "id required" }, 400);

    try {
      // For episode IDs like "tt0944947:1:1", fetch the series meta and find the episode
      const seriesId = id.includes(":") ? id.split(":")[0] : id;
      const res = await fetch(`${CINEMETA_URL}/meta/${type}/${seriesId}.json`);
      if (!res.ok) return json({ error: "Not found" }, 404);
      const data = await res.json();
      const meta = data.meta || data;

      // If it's an episode ID, extract the specific episode info
      if (id.includes(":") && meta.videos) {
        const parts = id.split(":");
        const seasonNum = parseInt(parts[1]);
        const epNum = parseInt(parts[2]);
        const episode = meta.videos.find(
          (v: Record<string, unknown>) => v.season === seasonNum && (v.number === epNum || v.episode === epNum)
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

      // Map Cinemeta videos to episodes format
      if (meta.videos && Array.isArray(meta.videos)) {
        meta.episodes = meta.videos
          .filter((v: Record<string, unknown>) => v.type === 'episode' || v.season)
          .map((v: Record<string, unknown>) => ({
            id: `${seriesId}:${v.season}:${v.number || v.episode}`,
            videoId: `${seriesId}:${v.season}:${v.number || v.episode}`,
            name: v.name,
            title: v.name,
            episodeNumber: v.number || v.episode,
            seasonNumber: v.season,
            description: v.description || '',
            runtime: v.runtime,
            rating: v.imdbRating ? Number(v.imdbRating) : undefined,
            stillUrl: v.poster ? `https://images.metahub.space/episode/med/${seriesId}/${v.season}/${v.number || v.episode}/img` : undefined,
          }));
      }

      return json(meta);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

// Stream proxy - proxies HLS playlists and segments, and MP4 files
http.route({
  path: "/api/proxy",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    const referer = url.searchParams.get("referer") || "";
    if (!target) return new Response("url required", { status: 400 });

    const proxyOrigin = url.origin;

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      };
      if (referer) headers.Referer = referer;

      const upstream = await fetch(target, { headers });
      if (!upstream.ok) return new Response(null, { status: upstream.status });

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";

      // For m3u8 playlists, rewrite segment URLs to go through this proxy
      if (target.endsWith(".m3u8") || contentType.includes("mpegurl") || contentType.includes("m3u8")) {
        const text = await upstream.text();
        const base = new URL(target);
        const rewritten = text.split("\n").map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            // Rewrite URI="..." in tags
            return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
              const abs = new URL(uri, base).href;
              return `URI="${proxyOrigin}/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}"`;
            });
          }
          // Rewrite segment URLs — use absolute URLs to avoid cross-origin resolution issues
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

      // For non-playlist content (segments, MP4s), stream through
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

      return new Response(upstream.body, { status: 200, headers: respHeaders });
    } catch (err: any) {
      return new Response("proxy error: " + err.message, { status: 502 });
    }
  }),
});

// OPTIONS for proxy
http.route({
  path: "/api/proxy",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

export default http;
