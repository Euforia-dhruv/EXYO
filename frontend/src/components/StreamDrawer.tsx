import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Check, Shield, Wifi, Film, Music, Globe, HardDrive, Zap } from 'lucide-react';
import { cn } from '../utils/helpers';
import type { Stream } from '../types';
import { ELogo } from './Logo';

interface Props {
  open: boolean;
  streams: Stream[];
  currentStreamUrl?: string;
  onSelect: (stream: Stream) => void;
  onClose: () => void;
  loading?: boolean;
  title?: string;
}

const QUALITY_COLORS: Record<string, string> = {
  '4k': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  '2160p': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  '1080p': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  '720p': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  '480p': 'bg-white/[0.06] text-white/50 border border-white/[0.06]',
};

const CODEC_COLORS: Record<string, string> = {
  h264: 'bg-emerald-500/10 text-emerald-400',
  hevc: 'bg-purple-500/10 text-purple-400',
  av1: 'bg-orange-500/10 text-orange-400',
  vp9: 'bg-blue-500/10 text-blue-400',
};

function parseQuality(stream: Stream): string {
  if (stream.quality && stream.quality !== 'Unknown') {
    const q = stream.quality.toLowerCase();
    if (q.includes('2160') || q.includes('4k')) return '4K';
    if (q.includes('1080')) return '1080p';
    if (q.includes('720')) return '720p';
    if (q.includes('480')) return '480p';
    return stream.quality;
  }
  const text = `${stream.title || ''} ${stream.description || ''} ${stream.name || ''}`.toLowerCase();
  if (text.includes('2160') || text.includes('4k')) return '4K';
  if (text.includes('1080')) return '1080p';
  if (text.includes('720')) return '720p';
  if (text.includes('480')) return '480p';
  return '';
}

function parseCodec(stream: Stream): string {
  const raw = (stream.videoCodec || stream.codec || '').toLowerCase();
  if (raw.includes('hevc') || raw.includes('h.265') || raw.includes('x265')) return 'hevc';
  if (raw.includes('av1') || raw.includes('av01')) return 'av1';
  if (raw.includes('vp9') || raw.includes('vp8')) return 'vp9';
  if (raw.includes('h264') || raw.includes('h.264') || raw.includes('avc') || raw.includes('x264')) return 'h264';
  const text = `${stream.title || ''} ${stream.description || ''}`.toLowerCase();
  if (text.includes('hevc') || text.includes('h.265') || text.includes('x265')) return 'hevc';
  if (text.includes('av1') || text.includes('av01')) return 'av1';
  return raw || 'h264';
}

function parseHDR(stream: Stream): boolean {
  const text = `${stream.title || ''} ${stream.description || ''} ${stream.name || ''}`.toLowerCase();
  return /\bhdr|hdr10|dolby\s*vision|dv|hl[gs]\b/.test(text);
}

function parseDolby(stream: Stream): boolean {
  const text = `${stream.title || ''} ${stream.description || ''} ${stream.name || ''}`.toLowerCase();
  return /\bdolby|atmos|truehd|eac3|ac-?3|dd\+?\s*\d/.test(text);
}

function parseAudioInfo(stream: Stream): string {
  const text = `${stream.title || ''} ${stream.description || ''} ${stream.name || ''}`;
  const lower = text.toLowerCase();
  if (lower.includes('atmos')) return 'Atmos';
  if (lower.includes('truehd') || lower.includes('true hd')) return 'TrueHD';
  if (lower.includes('dts-hd') || lower.includes('dtshd')) return 'DTS-HD';
  if (lower.includes('dts')) return 'DTS';
  if (lower.includes('eac3') || lower.includes('e-ac-3') || lower.includes('dd+')) return 'E-AC-3';
  if (lower.includes('ac3') || lower.includes('ac-3') || lower.includes('dd ')) return 'AC-3';
  if (lower.includes('aac')) return 'AAC';
  if (lower.includes('7.1')) return '7.1';
  if (lower.includes('5.1')) return '5.1';
  if (lower.includes('2.0') || lower.includes('stereo')) return '2.0';
  if (stream.audioCodec) return stream.audioCodec;
  return '';
}

function parseLanguage(stream: Stream): string {
  if (stream.description) {
    const langMatch = stream.description.match(/\b(eng(?:lish)?|hin(?:di)?|spa(?:nish)?|fre?nch|ger(?:man)?|jpn?(?:ese)?|kor?(?:ean)?|chi?(?:nese)?|por?(?:tuguese)?|ara?(?:bic)?|ita?(?:lian)?|rus(?:sian)?|tur(?:kish)?|thai|vie(?:tnamese)?|ind(?:onesian)?|may(?:alay)?|tel(?:ugu)?|tam(?:il)?|mar(?:athi)?|ben(?:gali)?|mal(?:ayalam)?|panjabi|punjabi|urdu|gujarati|odia|kannada|konkani|assamese|manipuri|sindhi|kashmiri|bengali)\b/i);
    if (langMatch) return langMatch[1];
  }
  if (stream.description) {
    const nameMatch = stream.description.match(/([A-Za-z]{2,3})\b/);
    if (nameMatch) {
      const n = nameMatch[1].toLowerCase();
      if (['eng', 'hin', 'spa', 'fre', 'ger', 'jpn', 'kor', 'chi', 'por', 'ara', 'ita', 'rus', 'tur'].includes(n)) {
        return n;
      }
    }
  }
  return '';
}

function parseFileSize(stream: Stream): string {
  if (stream.description) {
    const sizeMatch = stream.description.match(/(\d+[\.,]?\d*)\s*(GB|MB|TB|KB)/i);
    if (sizeMatch) return `${sizeMatch[1]}${sizeMatch[2].toUpperCase()}`;
  }
  return '';
}

function getProviderColor(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('pengu')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  if (lower.includes('anime')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
  if (lower.includes('flix')) return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  return 'bg-white/[0.06] text-white/50 border-white/[0.06]';
}

export default function StreamDrawer({ open, streams, currentStreamUrl, onSelect, onClose, loading, title }: Props) {
  const enrichedStreams = useMemo(() => {
    return streams.map((s) => {
      const quality = parseQuality(s);
      const codec = parseCodec(s);
      const hdr = parseHDR(s);
      const dolby = parseDolby(s);
      const audio = parseAudioInfo(s);
      const language = parseLanguage(s);
      const fileSize = parseFileSize(s);
      return { ...s, quality, codec, hdr, dolby, audio, language, fileSize };
    });
  }, [streams]);

  const sorted = useMemo(() => {
    const qRank: Record<string, number> = { '4K': 5, '1080p': 4, '720p': 3, '480p': 2 };
    const cRank: Record<string, number> = { h264: 3, vp9: 2, av1: 2, hevc: 1 };
    return [...enrichedStreams].sort((a, b) => {
      const qA = qRank[a.quality] || 0;
      const qB = qRank[b.quality] || 0;
      if (qB !== qA) return qB - qA;
      const cA = cRank[a.codec] || 0;
      const cB = cRank[b.codec] || 0;
      return cB - cA;
    });
  }, [enrichedStreams]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[85vh] glass-heavy rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg">Select Stream</h2>
                <p className="text-white/40 text-sm mt-0.5">
                  {loading ? 'Loading streams...' : `${sorted.length} stream${sorted.length !== 1 ? 's' : ''} available`}
                  {title && <span className="text-white/25"> · {title}</span>}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stream list */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/[0.04] shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 rounded-lg bg-white/[0.06]" />
                          <div className="flex gap-2">
                            <div className="h-5 w-12 rounded-lg bg-white/[0.06]" />
                            <div className="h-5 w-14 rounded-lg bg-white/[0.06]" />
                            <div className="h-5 w-16 rounded-lg bg-white/[0.06]" />
                          </div>
                        </div>
                        <div className="w-20 h-9 rounded-xl bg-white/[0.06]" />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="opacity-20 mb-4 flex justify-center"><ELogo size={48} /></div>
                  <p className="text-white/40 text-sm font-medium">No streams available</p>
                  <p className="text-white/25 text-xs mt-1">Try a different addon or check back later</p>
                </div>
              ) : (
                sorted.map((stream, i) => {
                  const isActive = currentStreamUrl === stream.url;
                  const qualityColor = QUALITY_COLORS[stream.quality?.toLowerCase() || ''] || QUALITY_COLORS['480p'];
                  const codecColor = CODEC_COLORS[stream.codec] || CODEC_COLORS.h264;
                  const providerColor = getProviderColor(stream.addonName);

                  return (
                    <motion.div
                      key={`${stream.url}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className={cn(
                        'rounded-2xl border transition-all duration-200 overflow-hidden',
                        isActive
                          ? 'border-red/30 bg-red/[0.04]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                      )}
                    >
                      <div className="p-4">
                        {/* Top row: Provider + quality badges + Play button */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {/* Provider */}
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border',
                                providerColor
                              )}>
                                <Shield className="w-3 h-3" />
                                {stream.addonName || 'Unknown'}
                              </span>

                              {/* Quality */}
                              {stream.quality && (
                                <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold', qualityColor)}>
                                  {stream.quality}
                                </span>
                              )}

                              {/* Codec */}
                              <span className={cn('px-2 py-1 rounded-lg text-[11px] font-semibold', codecColor)}>
                                {stream.codec.toUpperCase()}
                              </span>

                              {/* HDR */}
                              {stream.hdr && (
                                <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  HDR
                                </span>
                              )}

                              {/* Dolby */}
                              {stream.dolby && (
                                <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  Dolby
                                </span>
                              )}
                            </div>

                            {/* Title / name */}
                            <p className="text-white text-sm font-medium truncate">
                              {stream.name || stream.title || `Stream ${i + 1}`}
                            </p>
                          </div>

                          {/* Play button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelect(stream)}
                            className={cn(
                              'shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                              isActive
                                ? 'bg-red/20 text-red border border-red/30'
                                : 'bg-red text-white hover:bg-red-hover'
                            )}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-4 h-4" />
                                Playing
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-white" />
                                Play
                              </>
                            )}
                          </motion.button>
                        </div>

                        {/* Bottom row: metadata chips */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {stream.audio && (
                            <span className="inline-flex items-center gap-1 text-white/35 text-[11px]">
                              <Music className="w-3 h-3" />
                              {stream.audio}
                            </span>
                          )}
                          {stream.language && (
                            <span className="inline-flex items-center gap-1 text-white/35 text-[11px]">
                              <Globe className="w-3 h-3" />
                              {stream.language}
                            </span>
                          )}
                          {stream.fileSize && (
                            <span className="inline-flex items-center gap-1 text-white/35 text-[11px]">
                              <HardDrive className="w-3 h-3" />
                              {stream.fileSize}
                            </span>
                          )}
                          {(stream as any).peers !== undefined && (stream as any).peers > 0 && (
                            <span className="inline-flex items-center gap-1 text-white/35 text-[11px]">
                              <Wifi className="w-3 h-3" />
                              {(stream as any).peers} peers
                            </span>
                          )}
                          {(stream as any).seeders !== undefined && (stream as any).seeders > 0 && (
                            <span className="inline-flex items-center gap-1 text-white/35 text-[11px]">
                              <Zap className="w-3 h-3" />
                              {(stream as any).seeders} seeds
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
