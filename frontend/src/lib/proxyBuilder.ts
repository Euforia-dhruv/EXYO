const WORKERS_PROXY_ORIGIN = 'https://exyo.cc.cd';

function encodeToken(target: string, referer: string): string {
  return btoa(JSON.stringify({ u: target, r: referer }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildWorkersProxyUrl(rawUrl: string, referer: string, format: string): string {
  const token = encodeToken(rawUrl, referer);
  if (format === 'hls') return `${WORKERS_PROXY_ORIGIN}/hls/${token}.m3u8`;
  return `${WORKERS_PROXY_ORIGIN}/mp4/${token}.mp4`;
}

export function extractFromVercelProxyUrl(vercelUrl: string): { rawUrl: string; referer: string } {
  try {
    const url = new URL(vercelUrl);
    const rawUrl = url.searchParams.get('url') || '';
    const referer = url.searchParams.get('referer') || '';
    return { rawUrl, referer };
  } catch {
    return { rawUrl: '', referer: '' };
  }
}

export function toWorkersProxyUrl(vercelUrl: string, format: string): string {
  const { rawUrl, referer } = extractFromVercelProxyUrl(vercelUrl);
  if (!rawUrl) return vercelUrl;
  return buildWorkersProxyUrl(rawUrl, referer, format);
}
