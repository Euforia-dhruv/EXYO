import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, HardDrive, Clock, BarChart3 } from 'lucide-react';

export interface StreamStats {
  downloadSpeed: number;
  bufferHealth: number;
  resolution: string;
  droppedFrames: number;
  totalFrames: number;
  latency: number;
  networkType: string;
  segmentCount: number;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  visible: boolean;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(Math.max(bytesPerSec, 1)) / Math.log(1024));
  return `${(bytesPerSec / Math.pow(1024, Math.min(i, 3))).toFixed(1)} ${units[Math.min(i, 3)]}`;
}

function getNetworkType(): string {
  const conn = (navigator as any).connection;
  if (!conn) return 'Unknown';
  return conn.effectiveType || conn.type || 'Unknown';
}

export function useStreamStats(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [stats, setStats] = useState<StreamStats>({
    downloadSpeed: 0,
    bufferHealth: 0,
    resolution: '-',
    droppedFrames: 0,
    totalFrames: 0,
    latency: 0,
    networkType: getNetworkType(),
    segmentCount: 0,
  });

  const lastBytesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const speedSamplesRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const measureSpeed = useCallback(() => {
    try {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const now = performance.now();
      const recent = entries.filter(
        (e) => (now - e.startTime) < 5000 && (e.transferSize ?? 0) > 0
      );
      let totalBytes = 0;
      for (const e of recent) {
        totalBytes += e.transferSize ?? 0;
      }

      const timeWindow = 3;
      const speed = totalBytes / timeWindow;

      speedSamplesRef.current.push(speed);
      if (speedSamplesRef.current.length > 5) speedSamplesRef.current.shift();

      const avgSpeed = speedSamplesRef.current.reduce((a, b) => a + b, 0) / speedSamplesRef.current.length;
      lastBytesRef.current = totalBytes;
      lastTimeRef.current = now;

      return avgSpeed;
    } catch {
      return 0;
    }
  }, []);

  const measureBufferHealth = useCallback((video: HTMLVideoElement): number => {
    if (!video.buffered.length || !video.duration) return 0;
    const currentTime = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      if (currentTime >= start && currentTime <= end) {
        return end - currentTime;
      }
    }
    return 0;
  }, []);

  const getResolution = useCallback((video: HTMLVideoElement): string => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return '-';
    if (h >= 2160) return '4K';
    if (h >= 1440) return '1440p';
    if (h >= 1080) return '1080p';
    if (h >= 720) return '720p';
    if (h >= 480) return '480p';
    if (h >= 360) return '360p';
    return `${h}p`;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    intervalRef.current = setInterval(() => {
      const downloadSpeed = measureSpeed();
      const bufferHealth = measureBufferHealth(video);
      const resolution = getResolution(video);
      const droppedFrames = (video as any).webkitDroppedFrames || (video as any).droppedFrames || 0;
      const totalFrames = (video as any).webkitDecodedFrameCount || (video as any).decodedFrames || 0;
      const latency = video.readyState >= 2 ? (video as any).latency || 0 : 0;

      let segmentCount = 0;
      try {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const now = performance.now();
        segmentCount = entries.filter(
          (e) => (now - e.startTime) < 10000 && e.name.includes('segment')
        ).length;
      } catch {}

      setStats({
        downloadSpeed,
        bufferHealth,
        resolution,
        droppedFrames,
        totalFrames,
        latency,
        networkType: getNetworkType(),
        segmentCount,
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoRef, measureSpeed, measureBufferHealth, getResolution]);

  return stats;
}

export default function StreamStatsOverlay({ videoRef, visible }: Props) {
  const stats = useStreamStats(videoRef);

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
          <div className="glass-heavy rounded-xl border border-white/[0.08] px-4 py-3 min-w-[220px]">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/[0.06]">
              <Activity className="w-3.5 h-3.5 text-red" />
              <span className="text-white/70 text-xs font-semibold">Stream Stats</span>
            </div>

            <div className="space-y-2">
              <StatRow
                icon={<Wifi className="w-3 h-3" />}
                label="Speed"
                value={formatSpeed(stats.downloadSpeed)}
              />
              <StatRow
                icon={<HardDrive className="w-3 h-3" />}
                label="Buffer"
                value={`${stats.bufferHealth.toFixed(1)}s`}
                bar={stats.bufferHealth > 0 ? Math.min((stats.bufferHealth / 30) * 100, 100) : 0}
              />
              <StatRow
                icon={<BarChart3 className="w-3 h-3" />}
                label="Quality"
                value={stats.resolution}
              />
              <StatRow
                icon={<Clock className="w-3 h-3" />}
                label="Network"
                value={stats.networkType.toUpperCase()}
              />
              {stats.droppedFrames > 0 && (
                <StatRow
                  icon={<Activity className="w-3 h-3 text-amber-400" />}
                  label="Dropped"
                  value={`${stats.droppedFrames}`}
                  warn
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatRow({ icon, label, value, bar, warn }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bar?: number;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/40">
          {icon}
          <span className="text-[11px]">{label}</span>
        </div>
        <span className={`text-xs font-mono font-semibold ${warn ? 'text-amber-400' : 'text-white/70'}`}>
          {value}
        </span>
      </div>
      {bar !== undefined && bar > 0 && (
        <div className="h-0.5 rounded-full bg-white/10 mt-1 overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-1500"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}
