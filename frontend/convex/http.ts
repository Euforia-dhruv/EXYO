import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const TORRENTIO_URL = "https://torrentio.strem.fun";
const CONVENIO_URL = "https://convenio.wiki";

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

// ── Streams: fetch from multiple addons in parallel ──
http.route({
  path: "/api/content/:id/streams",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];
    const type = url.searchParams.get("type") || "movie";
    const addonsParam = url.searchParams.get("addons");

    // If specific addon URLs are provided, fetch from those
    if (addonsParam) {
      const addonUrls = addonsParam.split(",").filter(Boolean);
      if (addonUrls.length > 0) {
        const results = await Promise.allSettled(
          addonUrls.map(async (addonUrl) => {
            const base = addonUrl.replace(/\/$/, "");
            const res = await fetch(`${base}/stream/${type}/${id}.json`);
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
        return json(allStreams);
      }
    }

    // Default: fetch from Torrentio + Convenio in parallel
    const [torrentioRes, convenioRes] = await Promise.allSettled([
      fetch(`${TORRENTIO_URL}/stream/${type}/${id}.json`),
      fetch(`${CONVENIO_URL}/stream/${type}/${id}.json`),
    ]);

    const allStreams: unknown[] = [];

    for (const result of [torrentioRes, convenioRes]) {
      if (result.status === "fulfilled" && result.value.ok) {
        try {
          const data = await result.value.json();
          const source = result.value.url.includes("torrentio") ? "Torrentio" : "Convenio";
          const baseUrl = (result.value.url as string).replace(/\/stream\/.*/, "");
          for (const s of data.streams || []) {
            allStreams.push({
              ...s,
              addonName: source,
              addonUrl: baseUrl,
            });
          }
        } catch {}
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allStreams.filter((s: unknown) => {
      const stream = s as Record<string, unknown>;
      const url = stream.url as string;
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    return json(deduped);
  }),
});

// ── Stream single addon (for custom addon URLs) ──
http.route({
  path: "/api/content/:id/stream",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];
    const type = url.searchParams.get("type") || "movie";
    const addon = url.searchParams.get("addon");
    if (!addon) return json({ error: "Addon URL required" }, 400);

    try {
      const res = await fetch(`${addon.replace(/\/$/, "")}/stream/${type}/${id}.json`);
      if (!res.ok) return json({ streams: [] });
      const data = await res.json();
      const baseName = new URL(addon).hostname;
      const streams = (data.streams || []).map((s: Record<string, unknown>) => ({
        ...s,
        addonName: baseName,
        addonUrl: addon.replace(/\/$/, ""),
      }));
      return json(streams);
    } catch {
      return json({ streams: [] });
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
