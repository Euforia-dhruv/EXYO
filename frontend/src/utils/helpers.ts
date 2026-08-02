export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getImageUrl = (url: string | undefined, size: 'sm' | 'md' | 'lg' = 'md'): string => {
  if (!url) return '/placeholder.svg';

  if (url.includes('image.tmdb.org')) {
    const sizes: Record<string, string> = {
      sm: 'w342',
      md: 'w500',
      lg: 'w1280',
    };
    return url.replace('/original/', `/${sizes[size]}/`);
  }

  return url;
};
