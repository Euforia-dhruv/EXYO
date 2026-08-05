import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import type { PlayerStream } from '../../hooks/usePlayer';

interface StreamSelectorProps {
  streams: PlayerStream[];
  selectedStream: PlayerStream | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stream: PlayerStream) => void;
  onManageAddons: () => void;
}

const QUALITY_ORDER: Record<string, number> = {
  '4k': 1, '2160p': 1, '1440p': 2, '1080p': 3, '720p': 4, '480p': 5, '360p': 6,
};

function getQualityOrder(quality: string): number {
  const normalized = quality.toLowerCase().replace(/\s/g, '');
  for (const [key, order] of Object.entries(QUALITY_ORDER)) {
    if (normalized.includes(key)) return order;
  }
  return 7;
}

function getHealthColor(seeds?: number): string {
  if (!seeds) return 'bg-gray-500';
  if (seeds > 50) return 'bg-green-500';
  if (seeds > 10) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getHealthLabel(seeds?: number): string {
  if (!seeds) return 'Unknown';
  if (seeds > 50) return 'Healthy';
  if (seeds > 10) return 'Moderate';
  return 'Low';
}

function QualityBadge({ quality, hdr, dolby }: { quality: string; hdr?: boolean; dolby?: boolean }) {
  const is4K = quality.toLowerCase().includes('4k') || quality.toLowerCase().includes('2160');
  const is1080 = quality.toLowerCase().includes('1080');

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'text-[11px] font-bold px-2 py-0.5 rounded-md',
          is4K
            ? 'bg-yellow-500/10 text-yellow-400'
            : is1080
            ? 'bg-exyo-red/10 text-exyo-red'
            : 'bg-white/[0.08] text-gray-300'
        )}
      >
        {quality}
      </span>
      {hdr && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
          HDR
        </span>
      )}
      {dolby && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
          Dolby
        </span>
      )}
    </div>
  );
}

export default function StreamSelector({
  streams,
  selectedStream,
  isOpen,
  onClose,
  onSelect,
  onManageAddons,
}: StreamSelectorProps) {
  const groupedStreams = useMemo(() => {
    const groups: Record<string, PlayerStream[]> = {};
    for (const stream of streams) {
      const key = stream.addonName || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(stream);
    }

    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => getQualityOrder(a.quality || '') - getQualityOrder(b.quality || '')
      );
    }

    return groups;
  }, [streams]);

  const addonNames = Object.keys(groupedStreams);

  const handleSelect = (stream: PlayerStream) => {
    onSelect(stream);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[400px] bg-exyo-black/95 backdrop-blur-xl border-l border-white/[0.06] z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[18px] font-bold text-white">Sources</h2>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {streams.length} stream{streams.length !== 1 ? 's' : ''} from{' '}
                    {addonNames.length} addon{addonNames.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {addonNames.map((addonName) => {
                const addonStreams = groupedStreams[addonName];
                return (
                  <motion.div
                    key={addonName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-exyo-red" />
                      <h3 className="text-[13px] font-bold text-gray-300 uppercase tracking-wider">
                        {addonName}
                      </h3>
                      <span className="text-[11px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {addonStreams.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {addonStreams.map((stream, i) => {
                        const isSelected =
                          selectedStream?.url === stream.url &&
                          selectedStream?.addonName === stream.addonName;
                        const isPlayable = stream.url && !stream.infoHash;

                        return (
                          <motion.button
                            key={`${addonName}-${i}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleSelect(stream)}
                            className={cn(
                              'w-full text-left p-4 rounded-xl border transition-all duration-200',
                              isSelected
                                ? 'bg-exyo-red/10 border-exyo-red/30'
                                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {stream.quality && (
                                  <QualityBadge
                                    quality={stream.quality}
                                    hdr={stream.hdr}
                                    dolby={stream.dolby}
                                  />
                                )}
                                {!isPlayable && stream.infoHash && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">
                                    Torrent (P2P)
                                  </span>
                                )}
                                {stream.codec && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/[0.04] text-gray-400">
                                    {stream.codec}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {stream.seeds !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={cn(
                                        'w-1.5 h-1.5 rounded-full',
                                        getHealthColor(stream.seeds)
                                      )}
                                    />
                                    <span className="text-[10px] text-gray-500">
                                      {getHealthLabel(stream.seeds)}
                                    </span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-exyo-red flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>

                            {stream.name && (
                              <p className="text-[13px] text-white font-medium truncate">
                                {stream.name}
                              </p>
                            )}
                            {stream.title && stream.title !== stream.name && (
                              <p className="text-[12px] text-gray-400 truncate mt-0.5">
                                {stream.title}
                              </p>
                            )}
                            {stream.description && (
                              <p className="text-[11px] text-gray-500 truncate mt-1">
                                {stream.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {stream.language && (
                                <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                  {stream.language}
                                </span>
                              )}
                              {stream.fileSize && (
                                <span className="text-[10px] text-gray-500">{stream.fileSize}</span>
                              )}
                              {stream.seeds !== undefined && (
                                <span className="text-[10px] text-gray-500">
                                  {stream.seeds} seed{stream.seeds !== 1 ? 's' : ''}
                                </span>
                              )}
                              {stream.peers !== undefined && (
                                <span className="text-[10px] text-gray-500">
                                  {stream.peers} peer{stream.peers !== 1 ? 's' : ''}
                                </span>
                              )}
                              <div className="flex-1" />
                              {!isPlayable && stream.infoHash && (
                                <span className="text-[10px] text-yellow-500/70">
                                  Torrent stream — may be slow without seeders
                                </span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              <button
                onClick={onManageAddons}
                className="w-full p-4 rounded-xl border border-dashed border-white/[0.1] text-gray-500 hover:text-white hover:border-exyo-red/30 hover:bg-white/[0.03] transition-all text-[13px] font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Manage Addons
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
