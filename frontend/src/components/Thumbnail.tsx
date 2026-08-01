import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function getItemBackground(item: CatalogItem | WatchHistory | WatchlistItem): string | undefined {
  if ('background' in item) return item.background;
  if ('backdropUrl' in item) return item.backdropUrl;
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
  const background = getItemBackground(item);

  const handleClick = () => {
    navigate(`/detail/${contentId}?type=${type}`);
  };

  const year = isCatalogItem(item) ? item.year : undefined;
  const imdbRating = isCatalogItem(item) ? item.imdbRating : undefined;
  const genres = isCatalogItem(item) ? item.genres : undefined;

  return (
    <div
      className="relative flex-shrink-0 w-40 md:w-52 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative aspect-video rounded overflow-hidden transition-all duration-300 ${
          isHovered ? 'scale-110 z-10 shadow-2xl' : ''
        }`}
        onClick={handleClick}
      >
        <img
          src={poster || background || '/placeholder.jpg'}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/watch/${contentId}?type=${type}`);
              }}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {showProgress && progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div
              className="h-full bg-exyo-red"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {isHovered && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-exyo-secondary rounded shadow-xl z-20 animate-fadeIn">
          <h3 className="font-semibold text-sm mb-1 truncate">
            {title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-exyo-gray mb-2">
            {year && <span>{year}</span>}
            {imdbRating && <span>⭐ {imdbRating}</span>}
          </div>

          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.slice(0, 2).map((genre: string, index: number) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-white/10 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {onAddToList && isCatalogItem(item) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToList(item);
              }}
              className="mt-2 w-full py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              + My List
            </button>
          )}
        </div>
      )}
    </div>
  );
}
