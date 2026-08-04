import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CINEMETA_URL = "https://v3-cinemeta.strem.io";

const DEFAULT_STREAM_ADDONS = [
  "https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D",
];

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        return (data.streams || []).map((s: Record<string, unknown>) => ({
          ...s,
          addonName: addonUrl.split("/")[2] || addonUrl,
          addonUrl: base,
        }));
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
      if (url.endsWith('.mkv')) return false;
      if (url.includes('.mkv?')) return false;
      if (url.includes('content-disposition') && url.includes('.mkv')) return false;
      return true;
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
      const streams = (data.streams || []).map((s: Record<string, unknown>) => ({
        ...s,
        addonName: addon.split("/")[2] || addon,
        addonUrl: base,
      }));
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
      const res = await fetch(`${CINEMETA_URL}/meta/subtitles/${type}/${id}.json`);
      if (!res.ok) return json([]);
      const data = await res.json();
      return json(data.subtitles || []);
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
      const res = await fetch(`${CINEMETA_URL}/meta/${type}/${id}.json`);
      if (!res.ok) return json({ error: "Not found" }, 404);
      const data = await res.json();
      return json(data.meta || data);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

export default http;
