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
    const amount = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className="mb-6 group/row">
      <h2 className="text-row-title font-bold mb-2 px-4 md:px-8 lg:px-12 tracking-wide text-white">
        {title}
      </h2>

      <div className="relative">
        {/* Left arrow - Netflix style */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-r from-exyo-dark/90 via-exyo-dark/50 to-transparent hover:from-exyo-dark z-10 flex items-center justify-start pl-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
          >
            <div className="w-9 h-9 rounded flex items-center justify-center bg-exyo-dark/80 hover:bg-white/10 transition-colors border border-white/5">
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
          className="flex gap-1.5 overflow-x-auto hide-scrollbar px-4 md:px-8 lg:px-12 py-1"
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

        {/* Right arrow - Netflix style */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-l from-exyo-dark/90 via-exyo-dark/50 to-transparent hover:from-exyo-dark z-10 flex items-center justify-end pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
          >
            <div className="w-9 h-9 rounded flex items-center justify-center bg-exyo-dark/80 hover:bg-white/10 transition-colors border border-white/5">
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
