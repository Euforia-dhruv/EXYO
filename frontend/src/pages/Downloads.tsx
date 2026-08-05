import { ArrowDownTrayIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useDownloadStore } from '../store/downloadStore';
import { cn, formatTime } from '../utils/helpers';

export default function Downloads() {
  const { completedDownloads, activeDownloads, removeDownload } = useDownloadStore();

  const allDownloads = [...activeDownloads, ...completedDownloads];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">Downloads</h2>

      {allDownloads.length === 0 ? (
        <div className="text-center py-16">
          <ArrowDownTrayIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/50 text-[14px] font-medium mb-1">No downloads</p>
          <p className="text-white/30 text-[12px]">Downloaded content will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allDownloads.map((dl) => (
            <div
              key={dl.id}
              className="bg-exyo-card rounded-xl border border-white/[0.04] p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                {dl.status === 'completed' ? (
                  <PlayIcon className="w-5 h-5 text-exyo-red" />
                ) : (
                  <div className="w-5 h-5 border-2 border-exyo-red/30 border-t-exyo-red rounded-full animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">{dl.title}</p>
                <p className="text-white/30 text-[11px] mt-0.5">
                  {dl.status === 'completed' ? (
                    'Downloaded'
                  ) : (
                    `${Math.round(dl.progress || 0)}% · ${formatTime(dl.estimatedTimeRemaining || 0)} remaining`
                  )}
                </p>
                {dl.status === 'downloading' && (
                  <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-exyo-red rounded-full transition-all duration-300"
                      style={{ width: `${dl.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeDownload(dl.id)}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-red-400 transition-all"
                aria-label="Remove download"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
