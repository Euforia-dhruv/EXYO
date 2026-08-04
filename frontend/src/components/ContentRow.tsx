import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    <div className="mb-10 md:mb-14 group/row">
      {/* Row header */}
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 mb-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-white tracking-tight">
          {title}
        </h2>
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(title)}`)}
          className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200"
        >
          See All
        </button>
      </div>

      <div className="relative">
        {/* Left fade edge */}
        {showLeftArrow && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--exyo-bg,#0A0A0A)] to-transparent z-10 pointer-events-none" />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-16 md:w-20 z-20 flex items-center justify-start pl-3 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </motion.button>
          </>
        )}

        {/* Content scroll */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-6 md:px-12 lg:px-16 py-2"
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

        {/* Right fade edge */}
        {showRightArrow && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--exyo-bg,#0A0A0A)] to-transparent z-10 pointer-events-none" />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 w-16 md:w-20 z-20 flex items-center justify-end pr-3 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
