import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const TORRENTIO_URL = "https://torrentio.strem.fun";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// OPTIONS preflight
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
  path: "/api/content/:id/streams",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];
    const type = url.searchParams.get("type") || "movie";

    try {
      const res = await fetch(`${TORRENTIO_URL}/stream/${type}/${id}.json`);
      if (!res.ok) return json({ error: "No streams" }, res.status);
      const data = await res.json();
      return json(data.streams || []);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

http.route({
  path: "/api/content/:id/subtitles",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];
    const type = url.searchParams.get("type") || "movie";

    try {
      const res = await fetch(`${CINEMETA_URL}/subtitles/${type}/${id}.json`);
      if (!res.ok) return json([]);
      const data = await res.json();
      return json(data.subtitles || []);
    } catch {
      return json([]);
    }
  }),
});

http.route({
  path: "/api/content/:id",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    const type = url.searchParams.get("type") || "movie";

    try {
      const res = await fetch(`${CINEMETA_URL}/${type}/${id}.json`);
      if (!res.ok) return json({ error: "Not found" }, 404);
      const data = await res.json();
      return json(data.meta || data);
    } catch {
      return json({ error: "Addon unreachable" }, 502);
    }
  }),
});

export default http;
