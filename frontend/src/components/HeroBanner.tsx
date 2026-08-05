import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { StarIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { CatalogItem } from '../types';
import { cn, prefersReducedMotion } from '../utils/helpers';

interface Props {
  items: CatalogItem[];
  autoPlayInterval?: number;
}

function HeroBanner({ items, autoPlayInterval = 8000 }: Props) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useRef(prefersReducedMotion());

  const visibleItems = items.filter(
    (item) => item.backdropUrl && item.description && item.backdropUrl.trim() !== ''
  );

  const currentItem = visibleItems[currentIndex];

  // Preload next image
  useEffect(() => {
    if (visibleItems.length <= 1) return;
    const nextIndex = (currentIndex + 1) % visibleItems.length;
    const nextItem = visibleItems[nextIndex];
    if (nextItem?.backdropUrl) {
      const img = new Image();
      img.src = nextItem.backdropUrl;
    }
  }, [currentIndex, visibleItems]);

  // Reset image loaded state on index change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  // Mark loaded after a brief delay to prevent flash
  useEffect(() => {
    if (imageLoaded) return;
    const timer = setTimeout(() => setImageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [imageLoaded]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  }, [isTransitioning, currentIndex]);

  const goNext = useCallback(() => {
    if (visibleItems.length <= 1) return;
    goToSlide((currentIndex + 1) % visibleItems.length);
  }, [currentIndex, visibleItems.length, goToSlide]);

  // Progress bar
  useEffect(() => {
    if (isPaused || reducedMotion.current || visibleItems.length <= 1) return;
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress((elapsed / autoPlayInterval) * 100);
    }, 50);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, isPaused, autoPlayInterval, visibleItems.length]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || reducedMotion.current || visibleItems.length <= 1) return;
    autoPlayRef.current = setInterval(goNext, autoPlayInterval);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [goNext, isPaused, autoPlayInterval, visibleItems.length]);

  const handlePlay = useCallback(() => {
    if (!currentItem) return;
    const id = currentItem.id || currentItem.imdbId || '';
    if (currentItem.type === 'tv' || currentItem.type === 'series') {
      navigate(`/series/${id}`);
    } else {
      navigate(`/movie/${id}`);
    }
  }, [currentItem, navigate]);

  const handleDetails = useCallback(() => {
    if (!currentItem) return;
    const id = currentItem.id || currentItem.imdbId || '';
    if (currentItem.type === 'tv' || currentItem.type === 'series') {
      navigate(`/series/${id}`);
    } else {
      navigate(`/movie/${id}`);
    }
  }, [currentItem, navigate]);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[75vh] min-h-[400px] max-h-[800px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured content"
      aria-roledescription="carousel"
    >
      {/* Background image */}
      {visibleItems.map((item, i) => (
        <div
          key={item.id || item.imdbId || i}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-in-out',
            i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {item.backdropUrl && (
            <img
              src={item.backdropUrl}
              alt=""
              className={cn(
                'w-full h-full object-cover transition-transform duration-[25s] ease-out',
                i === currentIndex && !reducedMotion.current ? 'scale-100' : 'scale-105'
              )}
            />
          )}
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-bg via-exyo-bg/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-bg/80 via-exyo-bg/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-exyo-bg to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-30 flex items-end pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 w-full">
          <div className="max-w-[540px]">
            {/* Badges */}
            <div className="flex items-center gap-2.5 mb-4">
              {currentItem?.rating && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 text-[12px] font-semibold border border-yellow-500/20">
                  <StarIcon className="w-3 h-3 fill-current" />
                  {currentItem.rating}
                </span>
              )}
              {currentItem?.year && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/60 text-[12px] font-medium border border-white/[0.06]">
                  <CalendarIcon className="w-3 h-3" />
                  {currentItem.year}
                </span>
              )}
              {currentItem?.runtime && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/60 text-[12px] font-medium border border-white/[0.06]">
                  <ClockIcon className="w-3 h-3" />
                  {currentItem.runtime}m
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-white text-[32px] sm:text-[44px] lg:text-[56px] font-bold leading-[1.05] tracking-tight mb-3 text-shadow-hero">
              {currentItem?.name || currentItem?.title || 'Untitled'}
            </h1>

            {/* Description */}
            {currentItem?.description && (
              <p className="text-white/65 text-[14px] sm:text-[15px] leading-relaxed line-clamp-3 mb-6">
                {currentItem.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlay}
                className="group/btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-black font-semibold text-[15px] hover:bg-white/90 transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20"
              >
                <PlayIcon className="w-5 h-5 fill-black" />
                <span>Play</span>
              </button>
              <button
                onClick={handleDetails}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.08] text-white font-medium text-[15px] hover:bg-white/[0.14] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 backdrop-blur-sm"
              >
                <InformationCircleIcon className="w-5 h-5" />
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      {visibleItems.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {visibleItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={cn(
                'transition-all duration-300 rounded-full',
                i === currentIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              )}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(HeroBanner);
