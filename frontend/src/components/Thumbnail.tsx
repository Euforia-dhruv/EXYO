import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, PlusIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { useUser } from '@clerk/clerk-react';
import type { CatalogItem } from '../types';
import { cn } from '../utils/helpers';

interface Props {
  item: CatalogItem;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
  showProgress?: boolean;
  progress?: number;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (id: string) => void;
  className?: string;
}

const PosterImage = memo(function PosterImage({
  src,
  alt,
  isLarge,
}: {
  src?: string;
  alt: string;
  isLarge: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out',
        isLarge ? 'scale-100 group-hover:scale-105' : 'scale-100 group-hover:scale-110'
      )}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
});

function Thumbnail({
  item,
  index = 0,
  size = 'md',
  showOverlay = true,
  showProgress = false,
  progress = 0,
  isWatchlisted = false,
  onToggleWatchlist,
  className,
}: Props) {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const itemId = item.id || item.imdbId || '';

  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const backdropUrl = useMemo(() => {
    if (!item.backdropUrl) return null;
    return item.backdropUrl.replace('/w780', '/w1280').replace('/w500', '/w780');
  }, [item.backdropUrl]);

  const posterUrl = useMemo(() => {
    if (!item.posterUrl) return null;
    return item.posterUrl.replace('/w342', '/w500');
  }, [item.posterUrl]);

  const displayImage = backdropUrl || posterUrl;

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'tv' || item.type === 'series') {
      navigate(`/series/${itemId}`);
    } else {
      navigate(`/movie/${itemId}`);
    }
  }, [item.type, itemId, navigate]);

  const handleWatchlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSignedIn && onToggleWatchlist) {
      onToggleWatchlist(itemId);
    }
  }, [isSignedIn, itemId, onToggleWatchlist]);

  const handleClick = useCallback(() => {
    if (item.type === 'tv' || item.type === 'series') {
      navigate(`/series/${itemId}`);
    } else {
      navigate(`/movie/${itemId}`);
    }
  }, [item.type, itemId, navigate]);

  return (
    <div
      className={cn(
        'poster-card group relative cursor-pointer select-none',
        isLarge ? 'aspect-[16/9]' : isSmall ? 'aspect-[2/3]' : 'aspect-[2/3]',
        className
      )}
      onClick={handleClick}
      role="article"
      aria-label={`${item.name || item.title || 'Untitled'} — ${item.year || ''}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Image */}
      {displayImage ? (
        <PosterImage src={displayImage} alt={item.name || item.title || 'Untitled'} isLarge={isLarge} />
      ) : (
        <div className="absolute inset-0 bg-exyo-elevated flex items-center justify-center">
          <span className="text-white/20 text-[11px] font-medium uppercase tracking-wider">No Image</span>
        </div>
      )}

      {/* Gradient overlay */}
      {showOverlay && !isLarge && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Hover action buttons */}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-all duration-200 shadow-lg"
              aria-label={`Play ${item.name || item.title}`}
            >
              <PlayIcon className="w-5 h-5 text-black ml-0.5" />
            </button>
            {isSignedIn && onToggleWatchlist && (
              <button
                onClick={handleWatchlist}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-lg',
                  isWatchlisted
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-black/40 border-white/30 text-white/70 hover:border-white/60 hover:text-white'
                )}
                aria-label={isWatchlisted ? 'Remove from My List' : 'Add to My List'}
              >
                {isWatchlisted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <PlusIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {showProgress && progress > 0 && (
        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-exyo-red transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Type badge */}
      {!isLarge && item.year && (
        <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium">
            {item.type === 'tv' || item.type === 'series' ? 'TV' : 'Movie'}
          </span>
        </div>
      )}

      {/* Rating badge */}
      {!isLarge && item.rating && (
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-yellow-400 text-[11px] font-semibold">
            <StarIcon className="w-3 h-3 fill-current" />
            {item.rating}
          </span>
        </div>
      )}

      {/* Bottom info strip (always visible for non-large) */}
      {!isLarge && (
        <div className="absolute bottom-0 inset-x-0 p-3 pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <h3 className="text-white text-[13px] font-semibold line-clamp-1 leading-tight">
            {item.name || item.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {item.year && (
              <span className="text-white/50 text-[11px]">{item.year}</span>
            )}
            {item.rating && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-yellow-400/80 text-[11px] font-medium flex items-center gap-0.5">
                  <StarIcon className="w-2.5 h-2.5 fill-current" />
                  {item.rating}
                </span>
              </>
            )}
            {item.runtime && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-[11px] flex items-center gap-0.5">
                  <ClockIcon className="w-2.5 h-2.5" />
                  {item.runtime}m
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Focus ring */}
      <div className="absolute inset-0 rounded-[inherit] ring-2 ring-exyo-red ring-offset-2 ring-offset-exyo-bg opacity-0 group-focus-visible:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

export default memo(Thumbnail);
