export type VideoFormat = 'hls' | 'mp4' | 'mkv' | 'webm' | 'avi' | 'ts' | 'flv' | 'ogg' | 'unknown';
export type VideoCodec = 'h264' | 'hevc' | 'vp8' | 'vp9' | 'av1' | 'mpeg2' | 'mpeg4' | 'theora' | 'unknown';
export type DecodeMethod = 'native' | 'hls.js' | 'ffmpeg-remux' | 'ffmpeg-decode' | 'webcodecs' | 'unknown';

interface FormatInfo {
  format: VideoFormat;
  codec: VideoCodec;
  isHdr: boolean;
  isDolby: boolean;
  confidence: 'high' | 'medium' | 'low';
}

const FORMAT_PATTERNS: [RegExp, VideoFormat][] = [
  [/\.m3u8(\?|#|&|$)/i, 'hls'],
  [/\.mp4(\?|#|&|$)/i, 'mp4'],
  [/\.mkv(\?|#|&|$)/i, 'mkv'],
  [/\.webm(\?|#|&|$)/i, 'webm'],
  [/\.avi(\?|#|&|$)/i, 'avi'],
  [/\.ts(\?|#|&|$)/i, 'ts'],
  [/\.flv(\?|#|&|$)/i, 'flv'],
  [/\.ogv?(\?|#|&|$)/i, 'ogg'],
  [/mpegurl/i, 'hls'],
  [/matroska/i, 'mkv'],
  [/video\/mp4/i, 'mp4'],
  [/video\/webm/i, 'webm'],
  [/video\/x-matroska/i, 'mkv'],
];

const CODEC_PATTERNS: [RegExp, VideoCodec][] = [
  [/hevc|h\.?265|x\.?265/i, 'hevc'],
  [/av1|av01/i, 'av1'],
  [/vp9|vp09/i, 'vp9'],
  [/vp8|vp08/i, 'vp8'],
  [/h\.?264|avc|x\.?264/i, 'h264'],
  [/mpeg-?2/i, 'mpeg2'],
  [/mpeg-?4/i, 'mpeg4'],
  [/theora/i, 'theora'],
];

export function detectFormat(url: string, title?: string, description?: string): FormatInfo {
  // Also decode the URL so we can detect extensions hidden behind %3F etc.
  let decodedUrl = url;
  try { decodedUrl = decodeURIComponent(url); } catch { /* already have raw url */ }
  const combined = `${url} ${decodedUrl} ${title || ''} ${description || ''}`;
  let format: VideoFormat = 'unknown';
  let codec: VideoCodec = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  for (const [pattern, fmt] of FORMAT_PATTERNS) {
    if (pattern.test(combined)) {
      format = fmt;
      confidence = 'high';
      break;
    }
  }

  if (format === 'unknown') {
    if (combined.includes('index') && combined.includes('.m3u8')) format = 'hls';
    else if (combined.includes('segment') || combined.includes('seg-')) format = 'hls';
    else if (combined.includes('cdn') || combined.includes('stream')) format = 'hls';
    // Fallback: check description/title for format keywords
    else if (/\bHLS\b/i.test(combined) || /mpegurl/i.test(combined)) format = 'hls';
    else if (/\bMP4\b/i.test(combined)) format = 'mp4';
    else if (/\bMKV\b/i.test(combined) || /matroska/i.test(combined)) format = 'mkv';
    else if (/\bWEBM\b/i.test(combined)) format = 'webm';
  }

  for (const [pattern, c] of CODEC_PATTERNS) {
    if (pattern.test(combined)) {
      codec = c;
      break;
    }
  }

  const isHdr = /hdr|dolby.?vision|dv|hdr10|hl[gs]/i.test(combined);
  const isDolby = /dolby|atmos|truehd|eac3|ac-?3/i.test(combined);

  return { format, codec, isHdr, isDolby, confidence };
}

export function canPlayNatively(format: VideoFormat, codec: VideoCodec): boolean {
  const v = document.createElement('video');

  if (format === 'hls') {
    if (Hls.isSupported()) return true;
    return !!v.canPlayType('application/vnd.apple.mpegurl');
  }

  const mimeTypes: Record<string, string> = {
    'mp4-h264': 'video/mp4; codecs="avc1.640028"',
    'mp4-hevc': 'video/mp4; codecs="hev1.1.6.L93.B0"',
    'mp4-hevc-alt': 'video/mp4; codecs="hvc1.1.6.L93.B0"',
    'mp4-av1': 'video/mp4; codecs="av01.0.08M.08"',
    'webm-vp8': 'video/webm; codecs="vp8"',
    'webm-vp9': 'video/webm; codecs="vp9"',
    'webm-av1': 'video/webm; codecs="av01"',
    'ogg-theora': 'video/ogg; codecs="theora"',
  };

  const key = `${format}-${codec}`;
  const altKey = `${format}-${codec}-alt`;

  if (mimeTypes[key]) {
    if (v.canPlayType(mimeTypes[key])) return true;
  }
  if (mimeTypes[altKey]) {
    if (v.canPlayType(mimeTypes[altKey])) return true;
  }

  if (format === 'mp4') return !!v.canPlayType('video/mp4');
  if (format === 'webm') return !!v.canPlayType('video/webm');
  if (format === 'ogg') return !!v.canPlayType('video/ogg');

  return false;
}

export async function selectDecodeMethod(
  format: VideoFormat,
  codec: VideoCodec
): Promise<DecodeMethod> {
  if (format === 'hls') return 'hls.js';

  // MKV containers can't play natively — skip straight to streaming player
  if (format === 'mkv' || format === 'avi' || format === 'flv') return 'webcodecs';

  // HEVC in MP4 may or may not play natively — try native, fallback handled by caller
  // AV1/VP9 in MP4/WebM should play natively in modern browsers

  return 'native';
}

import Hls from 'hls.js';
