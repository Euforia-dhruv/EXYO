import { memo, useCallback } from 'react';
import { XMarkIcon, CheckIcon, PlayIcon, ServerIcon } from '@heroicons/react/24/outline';
import type { Stream } from '../../types';
import { cn } from '../../utils/helpers';

interface StreamSelectorProps {
  streams: Stream[];
  currentStream?: Stream | null;
  onSelect: (stream: Stream) => void;
  onClose: () => void;
  loading?: boolean;
}

function StreamSelector({ streams, currentStream, onSelect, onClose, loading }: StreamSelectorProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const getCodecBadge = (stream: Stream) => {
    const info = [];
    if (stream.videoCodec && stream.videoCodec !== 'Unknown') {
      info.push(stream.videoCodec.toUpperCase());
    }
    if (stream.audioCodec && stream.audioCodec !== 'Unknown') {
      info.push(stream.audioCodec.toUpperCase());
    }
    return info.length > 0 ? info.join(' / ') : null;
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full sm:w-[min(480px,90vw)] max-h-[80vh] bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-exyo-red/10 flex items-center justify-center">
              <ServerIcon className="w-5 h-5 text-exyo-red" />
            </div>
            <div>
              <h3 className="text-white text-[15px] font-semibold">Select Stream</h3>
              <p className="text-white/40 text-[12px]">{streams.length} streams available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/50 hover:text-white transition-all duration-200"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Streams list */}
        <div className="overflow-y-auto max-h-[calc(80vh-70px)] overscroll-contain">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-2 border-exyo-red/20 border-t-exyo-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-[13px]">Fetching streams...</p>
            </div>
          ) : streams.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/50 text-[13px]">No streams available</p>
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {streams.map((stream, i) => {
                const isSelected = currentStream?.url === stream.url;
                const badge = getCodecBadge(stream);

                return (
                  <button
                    key={`${stream.url}-${i}`}
                    onClick={() => onSelect(stream)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 group',
                      isSelected
                        ? 'bg-exyo-red/10 border border-exyo-red/20'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    )}
                  >
                    {/* Play indicator */}
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      isSelected
                        ? 'bg-exyo-red text-white'
                        : 'bg-white/[0.06] text-white/40 group-hover:bg-white/[0.1] group-hover:text-white/70'
                    )}>
                      {isSelected ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          'text-[13px] font-medium truncate',
                          isSelected ? 'text-white' : 'text-white/80'
                        )}>
                          {stream.name || stream.title || `Stream ${i + 1}`}
                        </span>
                        {stream.quality && stream.quality !== 'Unknown' && (
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                            isSelected
                              ? 'bg-exyo-red/20 text-exyo-red'
                              : 'bg-white/[0.06] text-white/50'
                          )}>
                            {stream.quality}
                          </span>
                        )}
                      </div>
                      {badge && (
                        <span className="text-[11px] text-white/30 font-medium">
                          {badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StreamSelector);
