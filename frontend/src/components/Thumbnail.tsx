import { useState, useRef, useMemo } from 'react';
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

function getGenres(item: CatalogItem | WatchHistory | WatchlistItem): string[] {
  if ('genres' in item && Array.isArray(item.genres)) return item.genres;
  return [];
}

export default function Thumbnail({ item, showProgress }: ThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const progress = isWatchHistory(item) ? item.progress : undefined;
  const contentId = getItemId(item);
  const type = getItemType(item);
  const title = getItemTitle(item);
  const poster = getItemPoster(item);
  const genres = getGenres(item);

  const year = isCatalogItem(item) ? item.year : undefined;
  const imdbRating = isCatalogItem(item) ? item.imdbRating : undefined;

  const matchScore = useMemo(() => {
    const r = parseFloat(imdbRating || '0');
    return r > 0 ? Math.min(Math.round(r * 10), 99) : null;
  }, [imdbRating]);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 300);
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
        className={`poster-card relative aspect-video rounded-xl overflow-hidden bg-exyo-surface ${isHovered ? 'shadow-[0_25px_80px_rgba(0,0,0,0.9)]' : ''}`}
        animate={{
          scale: isHovered ? 1.08 : 1,
          zIndex: isHovered ? 40 : 1,
          y: isHovered ? -12 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30"
            >
              {/* Top: Title + Metadata */}
              <div className="absolute top-0 left-0 right-0 p-3.5 pb-0">
                <p className="text-[13px] font-bold text-white truncate leading-tight">{title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {matchScore !== null && <span className="text-[11px] font-bold text-green-400">{matchScore}% Match</span>}
                  {year && <span className="text-[10px] text-gray-300 font-medium">{year}</span>}
                  {type === 'series' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 border border-gray-500 rounded text-gray-400">Series</span>
                  )}
                  {imdbRating && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-400">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      {imdbRating}
                    </span>
                  )}
                </div>
              </div>

              {/* Center: Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.06, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/watch/${contentId}?type=${type}`);
                  }}
                  className="w-14 h-14 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/20 transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-7 h-7 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.button>
              </div>

              {/* Bottom: Genres + Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 pt-0">
                <div className="flex items-center gap-1.5 mb-2">
                  {genres.slice(0, 3).map((genre, i) => (
                    <span key={i} className="text-[9px] font-medium text-gray-300 flex items-center gap-1">
                      {i > 0 && <span className="text-gray-600">•</span>}
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/detail/${contentId}?type=${type}`);
                    }}
                    aria-label="Add to My List"
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-colors border border-white/10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/detail/${contentId}?type=${type}`);
                    }}
                    aria-label="More info"
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-colors border border-white/10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-10">
            <div className="h-full bg-exyo-red" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
