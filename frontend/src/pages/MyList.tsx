import { useMemo } from 'react';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { ListOrdered } from 'lucide-react';
import Card from '../components/Card';
import { ELogo } from '../components/Logo';

export default function MyList() {
  const watchlist = useConvexQuery(api.watchlist.getWatchlist);
  const removeMutation = useConvexMutation(api.watchlist.removeFromWatchlist);

  const items = useMemo(() => {
    if (!watchlist || !Array.isArray(watchlist)) return [];
    return watchlist.map((item: any) => ({
      id: item.contentId,
      name: item.title,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      type: item.contentType,
    }));
  }, [watchlist]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <ListOrdered className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">My List</h1>
      </div>

      {items.length === 0 ? (
        <div className="glass glass-border rounded-3xl p-12 text-center">
          <div className="opacity-20 mb-4 flex justify-center"><ELogo size={48} /></div>
          <p className="text-white/50 font-medium mb-1">Your list is empty</p>
          <p className="text-white/25 text-sm">Add movies and series to your list</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item, i) => (
            <Card key={item.id || i} item={item} index={i} size="md" />
          ))}
        </div>
      )}
    </motion.div>
  );
}
