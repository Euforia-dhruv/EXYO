import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Thumbnail from '../components/Thumbnail';
import { PlayIcon } from '@heroicons/react/24/outline';
import type { CatalogItem } from '../types';

export default function ContinueWatching() {
  const { isSignedIn } = useUser();
  const watchHistory = useConvexQuery(api.watchHistory.getContinueWatching);

  const items: CatalogItem[] = useMemo(() => {
    if (!watchHistory || !Array.isArray(watchHistory)) return [];
    return watchHistory
      .filter((item: { progress?: number }) => item.progress && item.progress > 0)
      .sort((a: { lastWatched?: number }, b: { lastWatched?: number }) => (b.lastWatched || 0) - (a.lastWatched || 0))
      .map((item: { title?: string; name?: string; posterUrl?: string; contentId?: string; id?: string; imdbId?: string; backdropUrl?: string; year?: string; rating?: number; progress?: number; duration?: number; contentType?: string }) => ({
        id: item.contentId || item.id || item.imdbId || '',
        name: item.name || item.title,
        title: item.title,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        year: item.year,
        rating: item.rating,
        type: item.contentType as 'movie' | 'tv' | undefined,
        progress: item.progress,
        duration: item.duration,
      }));
  }, [watchHistory]);

  return (
    <main className="min-h-screen pt-8 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-8">
          <PlayIcon className="w-7 h-7 text-exyo-red" />
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">Continue Watching</h1>
          {items.length > 0 && (
            <span className="text-white/30 text-[14px]">({items.length})</span>
          )}
        </div>

        {!isSignedIn ? (
          <div className="text-center py-20">
            <p className="text-white/50 text-[14px] mb-4">Sign in to track your watch progress</p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-exyo-red hover:bg-exyo-red-hover text-white text-[13px] font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <PlayIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/50 text-[14px] font-medium mb-1">Nothing in progress</p>
            <p className="text-white/30 text-[12px]">Start watching something to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item, i) => (
              <Thumbnail
                key={item.id || i}
                item={item}
                size="md"
                showProgress
                progress={item.progress || 0}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
