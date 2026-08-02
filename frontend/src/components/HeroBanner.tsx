import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { CatalogItem } from '../types';

interface HeroBannerProps {
  items: CatalogItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(next, 7000);
    return () => clearInterval(interval);
  }, [items.length, next]);

  if (!items.length) return null;

  const item = items[currentIndex];
  if (!item) return null;

  const bgVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-20%' : '20%', opacity: 0 }),
  };

  return (
    <div className="relative h-[90vh] min-h-[600px] max-h-[900px] w-full overflow-hidden">
      {/* Background images with Netflix-style slide */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${item.background || item.poster})`,
              transform: 'scale(1.05)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Netflix-style gradient overlays */}
      <div className="absolute inset-0 bg-hero-gradient-left pointer-events-none" />
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark/90 via-exyo-dark/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-exyo-dark to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-[12%] left-0 right-0 px-6 md:px-12 lg:px-[5vw]">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Title - Netflix HUGE style */}
              <h1 className="text-hero md:text-hero-md lg:text-hero-lg font-extrabold mb-3 tracking-tight leading-none">
                {item.name}
              </h1>

              {/* Metadata row - clean, minimal */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                {item.imdbRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {item.imdbRating}
                  </span>
                )}
                {item.year && <span className="text-exyo-gray/70 font-medium">{item.year}</span>}
                {item.runtime && <span className="text-exyo-gray/70 font-medium">{item.runtime}</span>}
                <span className="px-1.5 py-0.5 text-[11px] font-bold border border-exyo-gray/30 rounded netflix uppercase tracking-wider text-exyo-gray/60">
                  HD
                </span>
              </div>

              {/* Description */}
              <p className="text-[15px] md:text-base text-exyo-gray/80 line-clamp-3 mb-6 leading-relaxed max-w-xl">
                {item.description}
              </p>

              {/* Genre tags */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.genres!.slice(0, 4).map((genre, i) => (
                    <span key={i} className="text-xs font-medium text-exyo-gray/60">
                      {genre}{i < Math.min(item.genres!.length, 4) - 1 ? <span className="ml-1.5 text-exyo-gray/30">•</span> : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Netflix-style buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate(`/watch/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-2.5 bg-white hover:bg-white/90 text-black px-7 md:px-9 py-2.5 md:py-3 rounded-netflix font-bold text-sm md:text-base transition-all duration-200 shadow-lg shadow-black/30"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                <button
                  onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-7 md:px-9 py-2.5 md:py-3 rounded-netflix font-bold text-sm md:text-base transition-all duration-200 border border-white/10"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  More Info
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Netflix-style slide indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-[5%] right-8 md:right-12 flex gap-1.5">
          {items.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-[3px] rounded-sm transition-all duration-500 ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/25 w-3 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-rotate progress bar */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <motion.div
            key={currentIndex}
            className="h-full bg-exyo-red"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 7, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
