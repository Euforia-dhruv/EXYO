import { useState } from 'react';
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

  const progress = isWatchHistory(item) ? item.progress : undefined;
  const contentId = getItemId(item);
  const type = getItemType(item);
  const title = getItemTitle(item);
  const poster = getItemPoster(item);

  const year = isCatalogItem(item) ? item.year : undefined;
  const imdbRating = isCatalogItem(item) ? item.imdbRating : undefined;

  return (
    <div
      className="relative flex-shrink-0 w-[150px] md:w-[190px] lg:w-[220px] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative aspect-[16/9] rounded-netflix overflow-hidden bg-exyo-secondary"
        animate={{
          scale: isHovered ? 1.08 : 1,
          zIndex: isHovered ? 30 : 1,
          y: isHovered ? -8 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.6)' : 'none' }}
      >
        {/* Poster */}
        <img
          src={poster || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay - Netflix style */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"
            >
              {/* Play button - center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/watch/${contentId}?type=${type}`);
                  }}
                  className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110"
                >
                  <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.button>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  {imdbRating && (
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-400">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      {imdbRating}
                    </span>
                  )}
                  {year && <span className="text-[11px] text-exyo-gray/60">{year}</span>}
                </div>
              </div>

              {/* My List button */}
              {onAddToList && isCatalogItem(item) && (
                <motion.button
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToList(item);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-exyo-muted/30">
            <div className="h-full bg-exyo-red" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>

      {/* Title below card */}
      <div className="mt-1.5 px-0.5">
        <p className="text-[13px] font-medium text-exyo-gray/80 truncate group-hover:text-white transition-colors duration-150">
          {title}
        </p>
      </div>
    </div>
  );
}
