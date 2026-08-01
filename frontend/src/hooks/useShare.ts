import { useState } from 'react';
import { useToast } from '../components/Toast';

interface ShareData {
  title: string;
  url: string;
  description?: string;
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);
  const { showToast } = useToast();

  const share = async (data: ShareData) => {
    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        });
        showToast('Shared successfully', 'success');
      } else {
        await navigator.clipboard.writeText(data.url);
        showToast('Link copied to clipboard', 'success');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        showToast('Failed to share', 'error');
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
