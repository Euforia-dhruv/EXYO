import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useShare() {
  const navigate = useNavigate();
  const share = useCallback(
    async (options: { title?: string; text?: string; url?: string }) => {
      const shareData = {
        title: options.title || 'EXYO',
        text: options.text || 'Check this out on EXYO',
        url: options.url || window.location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
        }
      } catch {
        // user cancelled or clipboard failed
      }
    },
    [navigate]
  );
  return share;
}
