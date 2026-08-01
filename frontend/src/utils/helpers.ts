export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getImageUrl = (url: string | undefined, size: 'sm' | 'md' | 'lg' = 'md'): string => {
  if (!url) return '/placeholder.jpg';

  if (url.includes('image.tmdb.org')) {
    const sizes: Record<string, string> = {
      sm: 'w185',
      md: 'w500',
      lg: 'w1280'
    };
    return url.replace('/original/', `/${sizes[size]}/`);
  }

  return url;
};

export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
