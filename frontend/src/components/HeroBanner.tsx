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
    const interval = setInterval(next, 8000);
    return () => clearInterval(interval);
  }, [items.length, next]);

  if (!items.length) return null;

  const item = items[currentIndex];
  if (!item) return null;

  const bgVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '30%', opacity: 0 }),
  };

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      {/* Background images */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${item.background || item.poster})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-exyo-dark via-exyo-dark/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-exyo-dark/80" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-20">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Genre tags */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.genres.slice(0, 3).map((genre, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm rounded-full text-gray-300 border border-white/5">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight leading-[0.9]">
                {item.name}
              </h1>

              {/* Metadata */}
              <div className="flex items-center gap-4 mb-5 text-sm">
                {item.imdbRating && (
                  <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {item.imdbRating}
                  </span>
                )}
                {item.year && <span className="text-gray-400">{item.year}</span>}
                {item.runtime && <span className="text-gray-400">{item.runtime}</span>}
                <span className="px-2 py-0.5 text-xs border border-white/20 rounded text-gray-400">HD</span>
              </div>

              {/* Description */}
              <p className="text-lg text-gray-300 line-clamp-3 mb-8 leading-relaxed max-w-xl">
                {item.description}
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/watch/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                <button
                  onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  More Info
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-8 right-8 flex gap-2">
          {items.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/30 w-3 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar for auto-rotate */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            key={currentIndex}
            className="h-full bg-exyo-red"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
