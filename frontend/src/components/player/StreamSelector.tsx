import { motion } from 'framer-motion';
import { X, Play, Check } from 'lucide-react';
import type { PlayerStream } from '../../hooks/usePlayer';
import { cn } from '../../utils/helpers';
import { ELogo } from '../Logo';

interface Props {
  streams: PlayerStream[];
  currentStream: PlayerStream | null;
  onSelect: (stream: PlayerStream) => void;
  onClose: () => void;
  loading?: boolean;
}

const QUALITY_COLORS: Record<string, string> = {
  '2160p': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  '4k': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  '1080p': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  '720p': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  '480p': 'bg-white/[0.06] text-white/50 border-white/[0.06]',
};

function getCodecBadge(codec?: string): { label: string; color: string } {
  const c = (codec || '').toLowerCase();
  if (c.includes('h264') || c.includes('avc')) return { label: 'H.264', color: 'bg-emerald-500/15 text-emerald-400' };
  if (c.includes('h265') || c.includes('hevc')) return { label: 'HEVC', color: 'bg-purple-500/15 text-purple-400' };
  if (c.includes('vp9')) return { label: 'VP9', color: 'bg-blue-500/15 text-blue-400' };
  if (c.includes('av1')) return { label: 'AV1', color: 'bg-orange-500/15 text-orange-400' };
  return { label: '', color: '' };
}

export default function StreamSelector({ streams, currentStream, onSelect, onClose, loading }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-end"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md h-full glass-heavy border-l border-white/[0.06] overflow-y-auto"
      >
        <div className="sticky top-0 glass-heavy border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-white font-bold text-lg">Streams</h3>
            <p className="text-white/40 text-sm">{streams.length} available</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <ELogo size={40} animate />
              <p className="text-white/40 text-sm">Loading streams...</p>
            </div>
          ) : streams.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-white/40 text-sm">No streams available</p>
            </div>
          ) : (
            streams.map((stream, i) => {
              const isActive = currentStream?.url === stream.url;
              const qColor = QUALITY_COLORS[stream.quality?.toLowerCase() || ''] || QUALITY_COLORS['480p'];
              const codec = getCodecBadge(stream.codec || stream.videoCodec);

              return (
                <motion.button
                  key={`${stream.url}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelect(stream)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl transition-all duration-200 border',
                    isActive
                      ? 'bg-red/10 border-red/20'
                      : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08]'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      isActive ? 'bg-red/20' : 'bg-white/[0.04]'
                    )}>
                      {isActive ? (
                        <Check className="w-5 h-5 text-red" />
                      ) : (
                        <Play className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {stream.name || stream.title || `Stream ${i + 1}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {stream.quality && stream.quality !== 'Unknown' && (
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg border', qColor)}>
                            {stream.quality}
                          </span>
                        )}
                        {codec.label && (
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg', codec.color)}>
                            {codec.label}
                          </span>
                        )}
                        {stream.addonName && (
                          <span className="text-[10px] text-white/30">{stream.addonName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
