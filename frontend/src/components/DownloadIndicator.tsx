import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDownloadStore } from '../store/downloadStore';

export default function DownloadIndicator() {
  const navigate = useNavigate();
  const downloads = useDownloadStore((s) => s.downloads);
  const active = downloads.filter((d) => d.status === 'downloading');
  const totalSpeed = active.reduce((s, d) => s + d.speed, 0);
  const avgProgress = active.length > 0 ? active.reduce((s, d) => s + d.progress, 0) / active.length : 0;

  if (active.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        onClick={() => navigate('/settings/downloads')}
        className="fixed bottom-6 right-6 z-50 bg-exyo-surface/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-2xl shadow-black/60 hover:bg-exyo-surface transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <div className="relative w-10 h-10 rounded-xl bg-exyo-red/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-exyo-red animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>

          {/* Info */}
          <div className="text-left">
            <p className="text-[12px] font-semibold text-white">
              {active.length} Active Download{active.length > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-gray-400">
              {totalSpeed > 0 ? `${(totalSpeed / 1024 / 1024).toFixed(1)} MB/s` : 'Starting...'}
            </p>
          </div>

          {/* Progress ring */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="16" cy="16" r="14" fill="none" stroke="#E50914" strokeWidth="3"
                strokeDasharray={`${avgProgress * 0.88} ${88 - avgProgress * 0.88}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
              {Math.round(avgProgress)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-exyo-red rounded-full"
            animate={{ width: `${avgProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
