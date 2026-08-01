import { useRef, useState } from 'react';
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

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth - 100;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items.length) return null;

  return (
    <div className="mb-8 group/row">
      <h2 className="text-lg md:text-xl font-semibold mb-4 px-4 md:px-12">
        {title}
      </h2>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-12 py-2"
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

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
