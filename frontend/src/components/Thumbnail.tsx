import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { CatalogItem, WatchHistory, WatchlistItem } from '../types';

interface ThumbnailProps {
  item: CatalogItem | WatchHistory | WatchlistItem;
  showProgress?: boolean;
  onAddToList?: (item: CatalogItem) => void;
}

function isCatalogItem(item: CatalogItem | WatchHistory | WatchlistItem): item is CatalogItem {
  return 'name' in item && 'type' in item;
}

function isWatchHistory(item: CatalogItem | WatchHistory | WatchlistItem): item is WatchHistory {
  return 'progress' in item;
}

function getItemId(item: CatalogItem | WatchHistory | WatchlistItem): string {
  if ('contentId' in item) return item.contentId;
  return item.id;
}

function getItemTitle(item: CatalogItem | WatchHistory | WatchlistItem): string {
  if ('name' in item) return item.name;
  if ('title' in item) return item.title;
  return '';
}

function getItemType(item: CatalogItem | WatchHistory | WatchlistItem): string {
  if ('type' in item) return item.type;
  if ('contentType' in item) return item.contentType;
  return 'movie';
}

function getItemPoster(item: CatalogItem | WatchHistory | WatchlistItem): string | undefined {
  if ('poster' in item) return item.poster;
  if ('posterUrl' in item) return item.posterUrl;
  return undefined;
}

export default function Thumbnail({ item, showProgress, onAddToList }: ThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const progress = isWatchHistory(item) ? item.progress : undefined;
  const contentId = getItemId(item);
  const type = getItemType(item);
  const title = getItemTitle(item);
  const poster = getItemPoster(item);

  const year = isCatalogItem(item) ? item.year : undefined;
  const imdbRating = isCatalogItem(item) ? item.imdbRating : undefined;

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 150);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  return (
    <div
      className="relative flex-shrink-0 w-[240px] md:w-[280px] lg:w-[320px] cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative aspect-video rounded-2xl overflow-hidden bg-exyo-surface"
        animate={{
          scale: isHovered ? 1.08 : 1,
          zIndex: isHovered ? 40 : 1,
          y: isHovered ? -12 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          boxShadow: isHovered
            ? '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(229,9,20,0.08)'
            : '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Poster */}
        <img
          src={poster || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"
            >
              {/* Play button - center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/watch/${contentId}?type=${type}`);
                  }}
                  className="w-14 h-14 md:w-16 md:h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/10 transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.button>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  {imdbRating && (
                    <span className="flex items-center gap-1 text-[12px] font-bold text-yellow-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      {imdbRating}
                    </span>
                  )}
                  {year && <span className="text-[12px] text-gray-400 font-medium">{year}</span>}
                </div>
              </div>

              {/* My List button */}
              {onAddToList && isCatalogItem(item) && (
                <motion.button
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToList(item);
                  }}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
            <div className="h-full bg-exyo-red" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>

      {/* Title below card */}
      <div className="mt-3 px-1">
        <p className="text-[14px] md:text-[15px] font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-200">
          {title}
        </p>
      </div>
    </div>
  );
}
