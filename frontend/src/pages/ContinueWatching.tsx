import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDownloadStore } from '../store/downloadStore';
import { useToast } from '../components/Toast';
import { SkeletonGrid } from '../components/Skeleton';

export default function ContinueWatching() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const continueWatching = useQuery(api.watchHistory.getContinueWatching);
  const addDownload = useDownloadStore((s) => s.addDownload);

  if (continueWatching === undefined) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-[100px] px-6 md:px-12 lg:px-16 pb-20">
        <h1 className="text-[32px] md:text-[40px] font-black mb-8 tracking-tight">Continue Watching</h1>
        <SkeletonGrid count={10} />
      </div>
    );
  }

  const items = continueWatching || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-[100px] px-6 md:px-12 lg:px-16 pb-20">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] md:text-[40px] font-black tracking-tight">Continue Watching</h1>
          <span className="text-gray-500 text-[13px] font-medium">
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 hover:bg-white/[0.05] transition-all group cursor-pointer"
                onClick={() => navigate(`/watch/${item.contentId}?type=${item.contentType}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Poster */}
                  <div className="w-16 h-20 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0 relative">
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125m17.25 0a1.125 1.125 0 00-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375M3.75 6V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-white truncate">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.season && item.episode && (
                        <span className="text-[11px] text-gray-400">S{item.season} E{item.episode}</span>
                      )}
                      <span className="text-[11px] text-gray-500">
                        {item.contentType === 'movie' ? 'Movie' : 'Series'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-exyo-red rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium flex-shrink-0">{Math.round(item.progress)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addDownload({
                          contentId: item.contentId,
                          title: item.title,
                          posterUrl: item.posterUrl,
                          type: item.contentType as 'movie' | 'series',
                          size: 'Unknown',
                          downloaded: '0 MB',
                        });
                        showToast('Download queued', 'success');
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Download"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
            <p className="text-gray-300 text-lg mb-2 font-medium">Nothing to continue</p>
            <p className="text-gray-500 text-sm mb-8">Start watching something and it will appear here.</p>
            <button onClick={() => navigate('/')} className="bg-exyo-red text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-exyo-red-dark transition-colors">
              Browse Content
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
