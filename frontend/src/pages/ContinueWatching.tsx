import { useMemo } from 'react';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Card from '../components/Card';

export default function ContinueWatching() {
  const watchHistory = useConvexQuery(api.watchHistory.getContinueWatching);

  const items = useMemo(() => {
    if (!watchHistory || !Array.isArray(watchHistory)) return [];
    return watchHistory.map((h: any) => ({
      id: h.contentId,
      name: h.title,
      backdropUrl: h.backdropUrl,
      type: h.contentType,
    }));
  }, [watchHistory]);

  const historyMap = useMemo(() => {
    if (!watchHistory || !Array.isArray(watchHistory)) return {};
    const map: Record<string, any> = {};
    for (const h of watchHistory) map[h.contentId] = h;
    return map;
  }, [watchHistory]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Clock className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Continue Watching</h1>
      </div>

      {items.length === 0 ? (
        <div className="glass glass-border rounded-3xl p-12 text-center">
          <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/50 font-medium mb-1">Nothing to continue</p>
          <p className="text-white/25 text-sm">Start watching to see your progress here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item, i) => (
            <Card
              key={item.id || i}
              item={item}
              index={i}
              size="md"
              showProgress={!!historyMap[item.id]?.progress}
              progress={historyMap[item.id]?.progress || 0}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
