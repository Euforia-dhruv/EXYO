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
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className="mb-10 group/row">
      <h2 className="text-lg md:text-xl font-bold mb-4 px-6 md:px-12 tracking-wide">
        {title}
      </h2>

      <div className="relative">
        {/* Left arrow */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-black/80 to-transparent hover:from-black/90 z-10 flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </motion.button>
        )}

        {/* Content */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto hide-scrollbar px-6 md:px-12 py-2"
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
            className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-black/80 to-transparent hover:from-black/90 z-10 flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
