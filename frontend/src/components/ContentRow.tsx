import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Thumbnail from './Thumbnail';
import type { CatalogItem, WatchHistory } from '../types';

interface ContentRowProps {
  title: string;
  items: (CatalogItem | WatchHistory)[];
  showProgress?: boolean;
  onAddToList?: (item: CatalogItem) => void;
}

export default function ContentRow({ title, items, showProgress, onAddToList }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.85;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className="mb-12 md:mb-16 group/row">
      {/* Row header */}
      <div className="flex items-center justify-between px-5 md:px-10 lg:px-14 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          {title}
        </h2>
        <button className="text-[13px] font-semibold text-exyo-muted hover:text-white transition-colors duration-200 flex items-center gap-1.5">
          See All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="relative">
        {/* Left arrow */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-14 md:w-20 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent hover:from-[#0B0B0B] z-10 flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </motion.button>
        )}

        {/* Content scroll */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-4 md:gap-5 overflow-x-auto hide-scrollbar px-5 md:px-10 lg:px-14 py-2"
        >
          {items.map((item, index) => (
            <Thumbnail
              key={`${('contentId' in item ? item.contentId : item.id) || index}-${index}`}
              item={item}
              showProgress={showProgress}
              onAddToList={onAddToList}
            />
          ))}
        </div>

        {/* Right arrow */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-14 md:w-20 bg-gradient-to-l from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent hover:from-[#0B0B0B] z-10 flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
