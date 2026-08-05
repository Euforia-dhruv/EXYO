import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CatalogItem } from '../types';
import Card from './Card';
import { cn } from '../utils/helpers';

interface Props {
  title: string;
  items: CatalogItem[];
  size?: 'sm' | 'md' | 'lg';
  viewAllLink?: string;
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
  isWatchlisted,
  onToggleWatchlist,
  watchHistory,
  className,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.85 : el.clientWidth * 0.85, behavior: 'smooth' });
  }, []);

  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <motion.div
      className={cn('relative group/row', className)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1 max-w-[1600px] mx-auto">
        <h2 className="text-white text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-white/40 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative max-w-[1600px] mx-auto">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-gradient-to-r from-bg/95 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.08] transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-gradient-to-l from-bg/95 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.08] transition-all">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Items */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto overflow-y-visible scroll-smooth hide-scrollbar py-2 px-4"
        >
          {visibleItems.map((item, i) => {
            const id = item.id || item.imdbId || '';
            const progress = watchHistory?.[id]?.progress;
            return (
              <Card
                key={id || `row-${title}-${i}`}
                item={item}
                index={i}
                size={size}
                showProgress={!!progress && progress > 0}
                progress={progress || 0}
                isWatchlisted={isWatchlisted?.(id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ContentRow);
