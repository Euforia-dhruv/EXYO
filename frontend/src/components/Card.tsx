import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star } from 'lucide-react';
import type { CatalogItem } from '../types';
import { cn } from '../utils/helpers';

interface Props {
  item: CatalogItem;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  progress?: number;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (id: string) => void;
}

function Card({ item, index = 0, size = 'md', showProgress, progress = 0, isWatchlisted, onToggleWatchlist }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const id = item.id || item.imdbId || '';
  const title = item.name || item.title || 'Untitled';
  const isTv = item.type === 'tv' || item.type === 'series';
  const isAnime = item.type === 'anime';
  const route = isAnime ? `/anime/${id}` : isTv ? `/series/${id}` : `/movie/${id}`;

  const sizeClasses = {
    sm: 'w-[130px] sm:w-[150px]',
    md: 'w-[180px] sm:w-[220px] md:w-[240px]',
    lg: 'w-[260px] sm:w-[300px] md:w-[340px]',
  };

  const aspectClasses = {
    sm: 'aspect-[2/3]',
    md: 'aspect-[2/3]',
    lg: 'aspect-[16/9]',
  };

  return (
    <motion.div
      className={cn('shrink-0 relative group/card', sizeClasses[size])}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <motion.div
        className="relative cursor-pointer"
        animate={{
          scale: hovered ? 1.05 : 1,
          y: hovered ? -8 : 0,
          zIndex: hovered ? 30 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={() => navigate(route)}
      >
        {/* Poster */}
        <div className={cn('relative rounded-2xl overflow-hidden card-shadow', aspectClasses[size])}>
          {item.posterUrl || item.backdropUrl ? (
            <img
              src={size === 'lg' ? (item.backdropUrl || item.posterUrl) : (item.posterUrl || item.backdropUrl)}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-elevated flex items-center justify-center">
              <span className="text-white/20 text-4xl font-bold">{title[0]}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

          {/* Hover content */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-end p-4"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Play button */}
            <motion.button
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: hovered ? 1 : 0.8, opacity: hovered ? 1 : 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(route);
              }}
            >
              <Play className="w-6 h-6 text-black fill-black ml-0.5" />
            </motion.button>

            {/* Bottom metadata */}
            <div>
              <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-white/50">
                {item.year && <span>{item.year}</span>}
                {item.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {item.rating}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Rating badge */}
          {item.rating && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-white">{item.rating}</span>
            </div>
          )}

          {/* Watchlist button */}
          {onToggleWatchlist && (
            <motion.button
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(id);
              }}
            >
              {isWatchlisted ? (
                <Check className="w-4 h-4 text-red" />
              ) : (
                <Plus className="w-4 h-4 text-white" />
              )}
            </motion.button>
          )}

          {/* Progress bar */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
              <div
                className="h-full bg-red rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(Card);
