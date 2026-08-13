import Hls from 'hls.js';

export type VideoFormat = 'hls' | 'mp4' | 'mkv' | 'webm' | 'avi' | 'ts' | 'flv' | 'ogg' | 'mov' | 'm4v' | '3gp' | 'rmvb' | 'rm' | 'vob' | 'wmv' | 'unknown';
export type VideoCodec = 'h264' | 'hevc' | 'vp8' | 'vp9' | 'av1' | 'mpeg2' | 'mpeg4' | 'theora' | 'divx' | 'xvid' | 'unknown';
export type DecodeMethod = 'native' | 'hls.js' | 'webcodecs' | 'unknown';

export interface FormatInfo {
  format: VideoFormat;
  codec: VideoCodec;
  isHdr: boolean;
  isDolby: boolean;
  confidence: 'high' | 'medium' | 'low';
}

const FORMAT_PATTERNS: [RegExp, VideoFormat][] = [
  [/\.m3u8(\?|#|&|$)/i, 'hls'],
  [/mpegurl/i, 'hls'],
  [/\.mp4(\?|#|&|$)/i, 'mp4'],
  [/\.m4v(\?|#|&|$)/i, 'm4v'],
  [/\.mov(\?|#|&|$)/i, 'mov'],
  [/\.3gp(\?|#|&|$)/i, '3gp'],
  [/\.mkv(\?|#|&|$)/i, 'mkv'],
  [/\.webm(\?|#|&|$)/i, 'webm'],
  [/\.avi(\?|#|&|$)/i, 'avi'],
  [/\.flv(\?|#|&|$)/i, 'flv'],
  [/\.ogv?(\?|#|&|$)/i, 'ogg'],
  [/\.rmvb?(\?|#|&|$)/i, 'rmvb'],
  [/\.vob(\?|#|&|$)/i, 'vob'],
  [/\.wmv(\?|#|&|$)/i, 'wmv'],
  [/\.ts(\?|#|&|$)/i, 'ts'],
  [/matroska/i, 'mkv'],
  [/video\/mp4/i, 'mp4'],
  [/video\/webm/i, 'webm'],
  [/video\/x-matroska/i, 'mkv'],
  [/video\/x-flv/i, 'flv'],
  [/video\/ogg/i, 'ogg'],
];

const CODEC_PATTERNS: [RegExp, VideoCodec][] = [
  [/hevc|h\.?265|x\.?265/i, 'hevc'],
  [/av1|av01/i, 'av1'],
  [/vp9|vp09/i, 'vp9'],
  [/vp8|vp08/i, 'vp8'],
  [/h\.?264|avc1?|x\.?264/i, 'h264'],
  [/mpeg-?2/i, 'mpeg2'],
  [/mpeg-?4/i, 'mpeg4'],
  [/theora/i, 'theora'],
  [/divx|dx[5-9]/i, 'divx'],
  [/xvid/i, 'xvid'],
];

export function detectFormat(url: string, title?: string, description?: string): FormatInfo {
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
    if (/index.*\.m3u8|m3u8.*index/i.test(combined)) { format = 'hls'; confidence = 'medium'; }
    else if (/segment|seg-|seg_|part\d+/i.test(combined)) { format = 'hls'; confidence = 'medium'; }
    else if (/playlist|master.*\.m3u8/i.test(combined)) { format = 'hls'; confidence = 'medium'; }
    else if (/\bHLS\b|mpegurl/i.test(combined)) { format = 'hls'; confidence = 'medium'; }
    else if (/\bMP4\b/i.test(combined)) { format = 'mp4'; confidence = 'medium'; }
    else if (/\bMKV\b|matroska/i.test(combined)) { format = 'mkv'; confidence = 'medium'; }
    else if (/\bWEBM\b/i.test(combined)) { format = 'webm'; confidence = 'medium'; }
    else if (/\bAVI\b/i.test(combined)) { format = 'avi'; confidence = 'medium'; }
    else if (/\bFLV\b/i.test(combined)) { format = 'flv'; confidence = 'medium'; }
  }

  if (format === 'unknown') {
    format = 'mp4';
    confidence = 'low';
  }

  for (const [pattern, c] of CODEC_PATTERNS) {
    if (pattern.test(combined)) {
      codec = c;
      break;
    }
  }

  if (codec === 'unknown') codec = 'h264';

  const isHdr = /hdr|dolby.?vision|dv|hdr10|hl[gs]/i.test(combined);
  const isDolby = /dolby|atmos|truehd|eac3|ac-?3/i.test(combined);

  return { format, codec, isHdr, isDolby, confidence };
}

const NATIVE_MIME: Record<string, string> = {
  'mp4-h264': 'video/mp4; codecs="avc1.640028"',
  'mp4-hevc': 'video/mp4; codecs="hev1.1.6.L93.B0"',
  'mp4-hevc-alt': 'video/mp4; codecs="hvc1.1.6.L93.B0"',
  'mp4-av1': 'video/mp4; codecs="av01.0.08M.08"',
  'mov-h264': 'video/mp4; codecs="avc1.640028"',
  'mov-hevc': 'video/mp4; codecs="hev1.1.6.L93.B0"',
  'm4v-h264': 'video/mp4; codecs="avc1.640028"',
  'm4v-hevc': 'video/mp4; codecs="hev1.1.6.L93.B0"',
  'webm-vp8': 'video/webm; codecs="vp8"',
  'webm-vp9': 'video/webm; codecs="vp9"',
  'webm-av1': 'video/webm; codecs="av01"',
  'ogg-theora': 'video/ogg; codecs="theora"',
  'ts-h264': 'video/mp2t; codecs="avc1.640028"',
  'ts-hevc': 'video/mp2t; codecs="hev1.1.6.L93.B0"',
};

export function canPlayNatively(format: VideoFormat, codec: VideoCodec): boolean {
  const v = document.createElement('video');

  if (format === 'hls') {
    if (Hls.isSupported()) return true;
    return !!v.canPlayType('application/vnd.apple.mpegurl');
  }

  const key = `${format}-${codec}`;
  const altKey = `${format}-${codec}-alt`;
  if (NATIVE_MIME[key] && v.canPlayType(NATIVE_MIME[key])) return true;
  if (NATIVE_MIME[altKey] && v.canPlayType(NATIVE_MIME[altKey])) return true;

  if (format === 'mp4' || format === 'mov' || format === 'm4v') return !!v.canPlayType('video/mp4');
  if (format === 'webm') return !!v.canPlayType('video/webm');
  if (format === 'ogg') return !!v.canPlayType('video/ogg');
  if (format === 'ts') return !!v.canPlayType('video/mp2t');
  if (format === '3gp') return !!v.canPlayType('video/3gpp');

  return false;
}

export function needsStreamingPlayer(format: VideoFormat, codec: VideoCodec): boolean {
  const nonNativeFormats: VideoFormat[] = ['mkv', 'avi', 'flv', 'rmvb', 'rm', 'vob', 'wmv'];
  if (nonNativeFormats.includes(format)) return true;
  if (format === 'mkv' || codec === 'hevc') return true;
  if (codec === 'divx' || codec === 'xvid') return true;
  return false;
}

export function selectDecodeMethod(format: VideoFormat, codec: VideoCodec): DecodeMethod {
  if (format === 'hls') return 'hls.js';
  if (needsStreamingPlayer(format, codec)) return 'webcodecs';
  if (canPlayNatively(format, codec)) return 'native';
  return 'native';
}
