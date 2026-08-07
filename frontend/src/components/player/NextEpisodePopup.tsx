import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, SkipForward } from 'lucide-react';

export interface EpisodeInfo {
  id: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  stillUrl?: string;
}

interface Props {
  show: boolean;
  nextEpisode: EpisodeInfo | null;
  onPlayNext: () => void;
  onDismiss: () => void;
  countdownSeconds?: number;
}

export default function NextEpisodePopup({ show, nextEpisode, onPlayNext, onDismiss, countdownSeconds = 10 }: Props) {
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!show || !nextEpisode) return;
    setCountdown(countdownSeconds);
  }, [show, nextEpisode, countdownSeconds]);

  useEffect(() => {
    if (!show || !nextEpisode || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          onPlayNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [show, nextEpisode, countdown, onPlayNext]);

  if (!nextEpisode) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-24 right-6 z-40 w-[380px]"
        >
          <div className="glass-heavy rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
            {nextEpisode.stillUrl && (
              <div className="relative h-[180px] overflow-hidden">
                <img
                  src={nextEpisode.stillUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-4">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Up Next</p>
              <h4 className="text-white text-sm font-bold mb-1 line-clamp-1">
                {nextEpisode.title || `Episode ${nextEpisode.episodeNumber}`}
              </h4>
              <p className="text-white/30 text-xs mb-4">
                S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onPlayNext(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Play Now
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-red rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: countdownSeconds, ease: 'linear' }}
                  />
                </div>
                <span className="text-white/30 text-xs font-mono">
                  {countdown}s
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
