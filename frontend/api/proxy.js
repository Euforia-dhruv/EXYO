const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Origin, Accept");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
}

function guessSegmentContentType(url) {
  const u = url.toLowerCase();
  if (u.includes(".ts") && (u.includes("seg-") || u.includes("segment") || u.includes("index"))) return "video/mp2t";
  if (u.includes(".m4s")) return "video/mp4";
  if (u.includes("init.mp4")) return "video/mp4";
  if (u.includes(".m4a")) return "audio/mp4";
  if (u.includes(".vtt") || u.includes("subtitle")) return "text/vtt";
  return null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const target = url.searchParams.get("url");
  const referer = url.searchParams.get("referer") || "";
  const auth = url.searchParams.get("auth") || "";

  if (!target) {
    return res.status(400).send("url required");
  }

  const proxyOrigin = url.origin;

  try {
    const headers = { "User-Agent": USER_AGENT };
    if (referer) headers.Referer = referer;
    if (auth) headers.Cookie = `auth_token=${auth}`;

    // Forward Range header for MP4 seeking
    const range = req.headers.range;
    if (range) headers.Range = range;

    // Manually follow redirects to preserve headers
    let currentUrl = target;
    let upstream;
    for (let i = 0; i < 5; i++) {
      upstream = await fetch(currentUrl, { headers, method: req.method, redirect: "manual" });
      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get("location");
        if (location) {
          currentUrl = location.startsWith("http") ? location : new URL(location, currentUrl).href;
          continue;
        }
      }
      break;
    }
    if (!upstream.ok) {
      return res.status(upstream.status).send("upstream error " + upstream.status);
    }

    const upstreamContentType = upstream.headers.get("content-type") || "application/octet-stream";
    const isM3u8 =
      currentUrl.endsWith(".m3u8") ||
      target.endsWith(".m3u8") ||
      upstreamContentType.includes("mpegurl") ||
      upstreamContentType.includes("m3u8");

    if (isM3u8) {
      const text = await upstream.text();
      const base = new URL(currentUrl);
      const rewritten = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
              const abs = new URL(uri, base).href;
              return `URI="${proxyOrigin}/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}"`;
            });
          }
          const abs = new URL(trimmed, base).href;
          return `${proxyOrigin}/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}`;
        })
        .join("\n");

      setCorsHeaders(res);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).send(rewritten);
    }

    // Binary: stream directly with range support
    setCorsHeaders(res);

    const forcedContentType = guessSegmentContentType(target) || upstreamContentType;
    res.setHeader("Content-Type", forcedContentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    // Forward status code (206 for partial content / range responses)
    const status = upstream.status;
    res.writeHead(status);

    const reader = upstream.body.getReader();
    async function pump() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    }
    pump().catch(() => { try { res.end(); } catch {} });
  } catch (err) {
    if (!res.headersSent) {
      return res.status(502).send("proxy error: " + err.message);
    }
  }
}

export const config = {
  api: {
    responseStreaming: true,
  },
  maxDuration: 30,
};
