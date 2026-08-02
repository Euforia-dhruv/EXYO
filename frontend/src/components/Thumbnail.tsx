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
  const genres = isCatalogItem(item) ? item.genres : undefined;

  return (
    <div
      className="relative flex-shrink-0 w-[160px] md:w-[200px] lg:w-[240px] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative aspect-[2/3] rounded-lg overflow-hidden"
        animate={{
          scale: isHovered ? 1.08 : 1,
          zIndex: isHovered ? 30 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
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
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
            >
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/watch/${contentId}?type=${type}`);
                  }}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/20 hover:scale-110 transition-transform"
                >
                  <svg className="w-7 h-7 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.button>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {imdbRating && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      {imdbRating}
                    </span>
                  )}
                  {year && <span className="text-xs text-gray-400">{year}</span>}
                </div>

                {genres && genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {genres.slice(0, 2).map((genre: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-gray-300">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* My List button */}
              {onAddToList && isCatalogItem(item) && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToList(item);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div className="h-full bg-exyo-red" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>

      {/* Title below card */}
      <div className="mt-2 px-1">
        <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-200">
          {title}
        </p>
        {year && (
          <p className="text-xs text-gray-500 mt-0.5">{year}</p>
        )}
      </div>
    </div>
  );
}
