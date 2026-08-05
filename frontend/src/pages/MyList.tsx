import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { SkeletonGrid } from '../components/Skeleton';

export default function MyList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const watchlist = useQuery(api.watchlist.getWatchlist);
  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);

  if (watchlist === undefined) {
    return (
      <div className="min-h-screen bg-exyo-black pt-[100px] px-6 md:px-12 lg:px-16 pb-20">
        <h1 className="text-[40px] font-black mb-8 tracking-tight">My List</h1>
        <SkeletonGrid count={10} />
      </div>
    );
  }

  const items = watchlist || [];

  return (
    <div className="min-h-screen bg-exyo-black pt-[100px] px-6 md:px-12 lg:px-16 pb-20">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-[40px] md:text-[48px] font-black tracking-tight">My List</h1>
          <span className="text-gray-500 text-sm font-medium">
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative cursor-pointer"
              >
                <div
                  onClick={() => navigate(`/detail/${item.contentId}?type=${item.contentType}`)}
                  className="aspect-video rounded-2xl overflow-hidden relative bg-white/[0.03]"
                >
                  <img
                    src={item.posterUrl || item.backdropUrl || '/placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 px-1">
                  <h3 className="font-medium text-[14px] truncate text-gray-300 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-[12px] text-gray-500">{item.contentType === 'movie' ? 'Movie' : 'Series'}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist({ id: item._id }).then(() => showToast('Removed from My List', 'success'));
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-28">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-2xl text-gray-300 mb-3 font-bold">Your list is empty</p>
            <p className="text-gray-500 text-sm mb-10">Add movies and TV shows to keep track of what you want to watch.</p>
            <button onClick={() => navigate('/')} className="bg-exyo-red text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-exyo-red-dark transition-colors shadow-lg shadow-exyo-red/20">
              Browse Content
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
