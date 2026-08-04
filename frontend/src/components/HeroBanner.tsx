import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useDownloadStore } from '../store/downloadStore';
import { useToast } from './Toast';
import type { CatalogItem } from '../types';

interface HeroBannerProps {
  items: CatalogItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addDownload = useDownloadStore((s) => s.addDownload);
  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);

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
    exit: (dir: number) => ({ x: dir > 0 ? '-15%' : '15%', opacity: 0 }),
  };

  const handleDownload = () => {
    addDownload({
      contentId: item.id,
      title: item.name,
      posterUrl: item.poster,
      type: (item.type as 'movie' | 'series') || 'movie',
      size: 'Unknown',
      downloaded: '0 MB',
    });
    showToast('Download queued', 'success');
  };

  return (
    <div className="relative h-[85vh] min-h-[560px] max-h-[880px] w-full overflow-hidden">
      {/* Background with slow zoom */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center animate-slowZoom"
            style={{
              backgroundImage: `url(${item.background || item.poster})`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-hero-gradient-left pointer-events-none" />
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-hero-gradient-top pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-[12%] left-0 right-0 px-6 md:px-12 lg:px-16">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Genre pills */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {item.genres.slice(0, 3).map((genre, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white/90 border border-white/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-black mb-4 tracking-tight leading-[0.9] text-white">
                {item.name}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4 text-[13px]">
                {item.imdbRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {item.imdbRating}
                  </span>
                )}
                {item.year && <span className="text-gray-300 font-medium">{item.year}</span>}
                {item.runtime && <span className="text-gray-300 font-medium">{item.runtime}</span>}
                <span className="px-2 py-0.5 text-[9px] font-bold border border-white/20 rounded-full uppercase tracking-wider text-gray-300">
                  HD
                </span>
              </div>

              {/* Description */}
              <p className="text-[15px] md:text-[16px] text-gray-300/90 line-clamp-3 mb-6 leading-relaxed max-w-2xl">
                {item.description}
              </p>

              {/* Action buttons - pill shaped */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => navigate(`/watch/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-7 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 shadow-2xl shadow-black/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </button>

                <button
                  onClick={async () => {
                    try {
                      await addToWatchlist({
                        contentId: item.id,
                        title: item.name,
                        posterUrl: item.poster,
                        backdropUrl: item.background,
                        contentType: (item.type as 'movie' | 'series') || 'movie',
                      });
                      showToast('Added to My List', 'success');
                    } catch {
                      showToast('Failed to add to list', 'error');
                    }
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  My List
                </button>

                <button
                  onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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

      {/* Slide indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-[5%] right-6 md:right-12 lg:right-16 flex gap-2">
          {items.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === currentIndex ? 'bg-white w-10' : 'bg-white/25 w-4 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-rotate progress */}
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
