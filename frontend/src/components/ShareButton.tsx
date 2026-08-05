import { useCallback, memo } from 'react';
import { ShareIcon } from '@heroicons/react/24/outline';
import { toast } from './Toast';

interface Props {
  url?: string;
  title?: string;
  className?: string;
}

function ShareButton({ url, title, className = '' }: Props) {
  const handleShare = useCallback(async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || document.title, url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  }, [url, title]);

  return (
    <button
      onClick={handleShare}
      className={`p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200 ${className}`}
      aria-label="Share"
    >
      <ShareIcon className="w-[18px] h-[18px]" />
    </button>
  );
}

export default memo(ShareButton);
