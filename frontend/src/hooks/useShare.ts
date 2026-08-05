import { useState } from 'react';
import { toast } from '../components/Toast';

interface ShareData {
  title: string;
  url: string;
  description?: string;
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (data: ShareData) => {
    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        });
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(data.url);
        toast.success('Link copied to clipboard');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const shareContent = async (contentId: string, title: string, type: string = 'movie') => {
    const url = `${window.location.origin}/detail/${contentId}?type=${type}`;
    await share({
      title: `Watch ${title} on EXYO`,
      url,
      description: `Check out ${title} on EXYO - Stream Everything`
    });
  };

  return { share, shareContent, isSharing };
}
