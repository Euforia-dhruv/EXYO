import { useRef, useState, useCallback, useEffect, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CatalogItem } from '../types';
import Thumbnail from './Thumbnail';
import { cn } from '../utils/helpers';

interface Props {
  title: string;
  items: CatalogItem[];
  size?: 'sm' | 'md' | 'lg';
  viewAllLink?: string;
  onItemView?: (item: CatalogItem) => void;
  isWatchlisted?: (id: string) => boolean;
  onToggleWatchlist?: (id: string) => void;
  watchHistory?: Record<string, { progress?: number; position?: number; duration?: number }>;
  className?: string;
}

function ContentRow({
  title,
  items,
  size = 'md',
  viewAllLink,
  onItemView,
  isWatchlisted,
  onToggleWatchlist,
  watchHistory,
  className,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, items]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.85;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const visibleItems = useMemo(() => items.filter(Boolean), [items]);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className={cn('relative group/row', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-white text-[18px] sm:text-[20px] font-semibold tracking-tight">
          {title}
        </h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-white/40 hover:text-white text-[13px] font-medium transition-colors duration-200"
          >
            View All →
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={cn(
              'absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center',
              'bg-gradient-to-r from-exyo-bg/95 to-transparent',
              'opacity-0 group-hover/row:opacity-100 transition-opacity duration-200',
              'cursor-pointer'
            )}
            aria-label="Scroll left"
          >
            <div className="w-10 h-10 rounded-full bg-exyo-elevated/80 backdrop-blur-sm flex items-center justify-center border border-white/[0.06] hover:bg-exyo-hover hover:border-white/[0.1] transition-all duration-200">
              <ChevronLeftIcon className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={cn(
              'absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center',
              'bg-gradient-to-l from-exyo-bg/95 to-transparent',
              'opacity-0 group-hover/row:opacity-100 transition-opacity duration-200',
              'cursor-pointer'
            )}
            aria-label="Scroll right"
          >
            <div className="w-10 h-10 rounded-full bg-exyo-elevated/80 backdrop-blur-sm flex items-center justify-center border border-white/[0.06] hover:bg-exyo-hover hover:border-white/[0.1] transition-all duration-200">
              <ChevronRightIcon className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Items */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto overflow-y-visible scroll-smooth hide-scrollbar py-1 -mx-1 px-1"
        >
          {visibleItems.map((item, i) => {
            const key = item.id || item.imdbId || `row-${title}-${i}`;
            const id = item.id || item.imdbId || '';
            const progress = watchHistory?.[id]?.progress;

            return (
              <div
                key={key}
                className={cn(
                  'flex-none',
                  size === 'sm' ? 'w-[130px] sm:w-[150px]' : 'w-[180px] sm:w-[220px] md:w-[240px]'
                )}
              >
                <Thumbnail
                  item={item}
                  index={i}
                  size={size}
                  showProgress={!!progress && progress > 0}
                  progress={progress || 0}
                  isWatchlisted={isWatchlisted?.(id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(ContentRow);
