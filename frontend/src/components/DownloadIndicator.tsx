import { memo, useMemo } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useDownloadStore } from '../store/downloadStore';
import { cn } from '../utils/helpers';

function DownloadIndicator() {
  const downloads = useDownloadStore((s) => s.downloads);

  const activeCount = useMemo(
    () => downloads.filter((d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'paused' || d.status === 'retrying').length,
    [downloads]
  );

  const totalCount = downloads.length;

  if (totalCount === 0) return null;

  return (
    <Link
      to="/downloads"
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
        'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/[0.1]'
      )}
      aria-label={`${totalCount} downloads, ${activeCount} active`}
    >
      <ArrowDownTrayIcon className="w-4 h-4 text-white/60" />
      {activeCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-exyo-red flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{activeCount}</span>
        </div>
      )}
    </Link>
  );
}

export default memo(DownloadIndicator);
