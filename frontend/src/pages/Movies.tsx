import { useQuery } from '@tanstack/react-query';
import { contentApi, type ContentSearchResult } from '../api/content.api';
import ContentRow from '../components/ContentRow';
import { RowSkeleton } from '../components/Skeleton';
import { Film } from 'lucide-react';
import { motion } from 'framer-motion';

function extractItems(data: ContentSearchResult | undefined) {
  return data?.results || [];
}

export default function Movies() {
  const { data: trending, isLoading: l1 } = useQuery({
    queryKey: ['catalog', 'movie', 'trending'],
    queryFn: () => contentApi.getCatalog('movie', 'trending'),
  });
  const { data: popular, isLoading: l2 } = useQuery({
    queryKey: ['catalog', 'movie', 'popular'],
    queryFn: () => contentApi.getCatalog('movie', 'popular'),
  });
  const { data: topRated, isLoading: l3 } = useQuery({
    queryKey: ['catalog', 'movie', 'top_rated'],
    queryFn: () => contentApi.getCatalog('movie', 'top_rated'),
  });
  const { data: newest, isLoading: l4 } = useQuery({
    queryKey: ['catalog', 'movie', 'newest'],
    queryFn: () => contentApi.getCatalog('movie', 'newest'),
  });

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-red" />
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">Movies</h1>
        </motion.div>

        <div className="space-y-10">
          {l1 ? <RowSkeleton /> : extractItems(trending).length > 0 && (
            <ContentRow title="Trending Movies" items={extractItems(trending)} size="md" />
          )}
          {l2 ? <RowSkeleton /> : extractItems(popular).length > 0 && (
            <ContentRow title="Popular Movies" items={extractItems(popular)} size="md" />
          )}
          {l4 ? <RowSkeleton /> : extractItems(newest).length > 0 && (
            <ContentRow title="New Releases" items={extractItems(newest)} size="md" />
          )}
          {l3 ? <RowSkeleton /> : extractItems(topRated).length > 0 && (
            <ContentRow title="Top Rated Movies" items={extractItems(topRated)} size="md" />
          )}
        </div>
      </div>
    </main>
  );
}
