import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, ArrowDown, ArrowUp, Users, BarChart3 } from 'lucide-react';

export interface TorrentStats {
  peers: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  downloaded: number;
  uploaded: number;
}

interface Props {
  stats: TorrentStats | null;
  visible: boolean;
}

function formatSpeed(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function TorrentStatsOverlay({ stats, visible }: Props) {
  if (!stats) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-6 z-30"
        >
          <div className="glass-heavy rounded-xl border border-white/[0.08] px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/[0.06]">
              <BarChart3 className="w-3.5 h-3.5 text-red" />
              <span className="text-white/70 text-xs font-semibold">Statistics</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-2.5">
              <StatItem icon={<Users className="w-3 h-3" />} label="Peers" value={String(stats.peers)} />
              <StatItem icon={<ArrowDown className="w-3 h-3" />} label="Down" value={formatSpeed(stats.downloadSpeed)} />
              <StatItem icon={<ArrowUp className="w-3 h-3" />} label="Up" value={formatSpeed(stats.uploadSpeed)} />
            </div>

            <div className="mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/30 text-[10px]">Progress</span>
                <span className="text-white/50 text-[10px] font-mono">{stats.progress.toFixed(1)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-red rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(stats.progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-white/30 mt-1.5 pt-1.5 border-t border-white/[0.04]">
              <span>↓ {formatBytes(stats.downloaded)}</span>
              <span>↑ {formatBytes(stats.uploaded)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-white/30 mb-0.5">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <span className="text-white text-xs font-semibold font-mono">{value}</span>
    </div>
  );
}
