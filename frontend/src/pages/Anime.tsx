import { useQuery } from '@tanstack/react-query';
import { contentApi, type ContentSearchResult } from '../api/content.api';
import ContentRow from '../components/ContentRow';
import { RowSkeleton } from '../components/Skeleton';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function extractItems(data: ContentSearchResult | undefined) {
  return data?.results || [];
}

export default function Anime() {
  const { data: topRated, isLoading: l1 } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-top-rated'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-top-rated'),
  });
  const { data: airing, isLoading: l2 } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-airing'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-airing'),
  });
  const { data: seasonReleases, isLoading: l3 } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-season-releases'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-season-releases'),
  });
  const { data: animeMovies, isLoading: l4 } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-movies'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-movies'),
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
            <Sparkles className="w-5 h-5 text-red" />
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">Anime</h1>
        </motion.div>

        <div className="space-y-10">
          {l1 ? <RowSkeleton /> : extractItems(topRated).length > 0 && (
            <ContentRow title="Top Rated Anime" items={extractItems(topRated)} size="md" />
          )}
          {l2 ? <RowSkeleton /> : extractItems(airing).length > 0 && (
            <ContentRow title="Currently Airing" items={extractItems(airing)} size="md" />
          )}
          {l3 ? <RowSkeleton /> : extractItems(seasonReleases).length > 0 && (
            <ContentRow title="Season Releases" items={extractItems(seasonReleases)} size="md" />
          )}
          {l4 ? <RowSkeleton /> : extractItems(animeMovies).length > 0 && (
            <ContentRow title="Anime Movies" items={extractItems(animeMovies)} size="md" />
          )}
          {!l1 && !l2 && !l3 && !l4 && extractItems(topRated).length === 0 && extractItems(airing).length === 0 && (
            <div className="py-20 text-center">
              <p className="text-white/40 text-sm">Enable the AnimeStream addon in Settings &gt; Streaming to see anime content</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
