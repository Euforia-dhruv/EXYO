import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CatalogItem } from '../types';

interface HeroBannerProps {
  items: CatalogItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (!items.length) return null;

  const item = items[currentIndex];
  if (!item) return null;

  return (
    <div className="relative h-[80vh] w-full">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${item.background || item.poster})`
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-exyo-dark via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slideUp">
          {item.name}
        </h1>

        <div className="flex items-center gap-4 mb-4 text-sm">
          {item.imdbRating && (
            <span className="text-exyo-gray">
              ⭐ {item.imdbRating}
            </span>
          )}
          {item.year && (
            <span className="text-exyo-gray">{item.year}</span>
          )}
          {item.runtime && (
            <span className="text-exyo-gray">{item.runtime}</span>
          )}
        </div>

        {item.genres && item.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.genres.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs border border-white/30 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <p className="text-lg text-exyo-gray line-clamp-3 mb-6">
          {item.description}
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/watch/${item.id}?type=${item.type}`)}
            className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold hover:bg-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>

          <button
            onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
            className="flex items-center gap-2 bg-white/20 text-white px-8 py-3 rounded font-semibold hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Info
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
