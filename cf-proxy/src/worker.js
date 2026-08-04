const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CLIENT_HINTS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

function browserHeaders(referer) {
  const origin = new URL(referer).origin;
  return { "User-Agent": USER_AGENT, ...CLIENT_HINTS, Referer: referer, Origin: origin };
}

const HLS_PREFIX = "/hls/";
const MP4_PREFIX = "/mp4/";

function decodeToken(token) {
  return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
}

function encodeToken(target, referer) {
  return Buffer.from(JSON.stringify({ u: target, r: referer }), "utf8").toString(
    "base64url"
  );
}

function proxyChild(rawUrl, baseUrl, referer, origin) {
  const abs = new URL(rawUrl, baseUrl).href;
  const isPlaylist = new URL(abs).pathname.endsWith(".m3u8");
  const ext = isPlaylist ? ".m3u8" : ".ts";
  return `${origin}${HLS_PREFIX}${encodeToken(abs, referer)}${ext}`;
}

function rewritePlaylist(text, baseUrl, referer, origin) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(
          /URI="([^"]+)"/g,
          (_m, uri) => `URI="${proxyChild(uri, baseUrl, referer, origin)}"`
        );
      }
      return proxyChild(trimmed, baseUrl, referer, origin);
    })
    .join("\n");
}

async function handleHls(request, path, origin) {
  const tokenWithExt = path.slice(HLS_PREFIX.length);
  const token = tokenWithExt.replace(/\.(m3u8|ts)$/, "");
  const { u: target, r: referer } = decodeToken(token);

  const upstream = await fetch(target, { headers: browserHeaders(referer) });
  if (!upstream.ok) return new Response(null, { status: upstream.status });

  const isPlaylist = new URL(target).pathname.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstream.text();
    return new Response(rewritePlaylist(text, target, referer, origin), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache",
      },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": upstream.headers.get("content-type") || "video/MP2T",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function handleMp4(request, path) {
  const token = path.slice(MP4_PREFIX.length).replace(/\.mp4$/, "");
  const { u: target, r: referer } = decodeToken(token);

  const range = request.headers.get("Range");
  const upstream = await fetch(target, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: referer,
      Origin: new URL(referer).origin,
      ...CLIENT_HINTS,
      Range: range || "bytes=0-",
    },
    redirect: "follow",
  });

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");

  const contentRange = upstream.headers.get("content-range");
  if (range && contentRange) {
    headers.set("Content-Range", contentRange);
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
  } else if (contentRange) {
    const total = contentRange.split("/")[1];
    if (total) headers.set("Content-Length", total);
  }

  const status = range ? upstream.status : 200;
  return new Response(upstream.body, { status, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path.startsWith(HLS_PREFIX)) return await handleHls(request, path, url.origin);
      if (path.startsWith(MP4_PREFIX)) return await handleMp4(request, path);
      return new Response("EXYO proxy — OK", { status: 200 });
    } catch (err) {
      return new Response("proxy error: " + err.message, { status: 502 });
    }
  },
};
