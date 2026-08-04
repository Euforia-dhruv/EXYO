import { useShare } from '../hooks/useShare';

interface ShareButtonProps {
  contentId: string;
  title: string;
  type?: string;
  className?: string;
}

export default function ShareButton({ contentId, title, type = 'movie', className = '' }: ShareButtonProps) {
  const { shareContent, isSharing } = useShare();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        shareContent(contentId, title, type);
      }}
      disabled={isSharing}
      className={`flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  );
}
