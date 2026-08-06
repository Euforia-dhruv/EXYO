import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, Calendar, Clock } from 'lucide-react';
import type { CatalogItem } from '../types';
import { cn, prefersReducedMotion } from '../utils/helpers';

interface Props {
  items: CatalogItem[];
  autoPlayInterval?: number;
}

function HeroBanner({ items, autoPlayInterval = 8000 }: Props) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useRef(prefersReducedMotion());

  const visibleItems = items.filter(
    (item) => item.backdropUrl && item.description && item.backdropUrl.trim() !== ''
  );

  useEffect(() => {
    if (visibleItems.length > 0 && currentIndex >= visibleItems.length) {
      setCurrentIndex(0);
    }
  }, [visibleItems.length, currentIndex]);

  const currentItem = visibleItems[currentIndex];

  useEffect(() => {
    if (visibleItems.length <= 1) return;
    const nextIndex = (currentIndex + 1) % visibleItems.length;
    const nextItem = visibleItems[nextIndex];
    if (nextItem?.backdropUrl) {
      const img = new Image();
      img.src = nextItem.backdropUrl;
    }
  }, [currentIndex, visibleItems]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setProgress(0);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  const goNext = useCallback(() => {
    if (visibleItems.length <= 1) return;
    goToSlide((currentIndex + 1) % visibleItems.length);
  }, [currentIndex, visibleItems.length, goToSlide]);

  useEffect(() => {
    if (isPaused || reducedMotion.current || visibleItems.length <= 1) return;
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(((Date.now() - startTime) / autoPlayInterval) * 100);
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [currentIndex, isPaused, autoPlayInterval, visibleItems.length]);

  useEffect(() => {
    if (isPaused || reducedMotion.current || visibleItems.length <= 1) return;
    autoPlayRef.current = setInterval(goNext, autoPlayInterval);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [goNext, isPaused, autoPlayInterval, visibleItems.length]);

  const handlePlay = useCallback(() => {
    if (!currentItem) return;
    const id = currentItem.id || currentItem.imdbId || '';
    navigate(currentItem.type === 'anime' ? `/anime/${id}` : currentItem.type === 'tv' || currentItem.type === 'series' ? `/series/${id}` : `/movie/${id}`);
  }, [currentItem, navigate]);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] min-h-[500px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background images with Ken Burns */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {currentItem?.backdropUrl && (
            <img
              src={currentItem.backdropUrl}
              alt=""
              className={cn(
                'w-full h-full object-cover',
                !reducedMotion.current && 'animate-[KenBurns_25s_ease-out_forwards]'
              )}
              style={{
                animation: reducedMotion.current
                  ? undefined
                  : `KenBurns 25s ease-out forwards`,
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Heavy gradient overlays */}
      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-end pb-20 sm:pb-24 lg:pb-28">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 w-full">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-[600px]"
          >
            {/* Metadata pills */}
            <div className="flex items-center gap-2.5 mb-5">
              {currentItem?.rating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentItem.rating}
                </span>
              )}
              {currentItem?.year && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] text-white/60 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentItem.year}
                </span>
              )}
              {currentItem?.runtime && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] text-white/60 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {currentItem.runtime}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-white text-[36px] sm:text-[52px] lg:text-[64px] font-extrabold leading-[1.02] tracking-tight mb-4 text-shadow-hero">
              {currentItem?.name || currentItem?.title || 'Untitled'}
            </h1>

            {/* Description */}
            {currentItem?.description && (
              <p className="text-white/60 text-[15px] sm:text-[16px] leading-relaxed line-clamp-3 mb-8">
                {currentItem.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlay}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-bold text-base shadow-xl shadow-white/10 hover:shadow-white/20 transition-shadow"
              >
                <Play className="w-6 h-6 fill-black" />
                Play
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlay}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl glass glass-border text-white font-bold text-base hover:bg-white/[0.08] transition-all"
              >
                <Info className="w-6 h-6" />
                Details
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Slide indicators */}
      {visibleItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {visibleItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: i === currentIndex ? 40 : 8 }}
            >
              <div className="absolute inset-0 bg-white/20" />
              {i === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-white rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progress / 100 }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.05 }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(HeroBanner);
