import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { FilmIcon, TvIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { user } = useUser();

  const { data: watchHistory } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: () => contentApi.getWatchHistory(user!.id),
    enabled: !!user,
  });

  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => contentApi.getWatchlist(user!.id),
    enabled: !!user,
  });

  const historyCount = Array.isArray(watchHistory) ? watchHistory.length : 0;
  const watchlistCount = Array.isArray(watchlist) ? watchlist.length : 0;

  const stats = [
    { label: 'Watched', value: historyCount, icon: FilmIcon, color: 'text-exyo-red' },
    { label: 'In My List', value: watchlistCount, icon: StarIcon, color: 'text-yellow-400' },
  ];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">General</h2>

      {/* Profile card */}
      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-exyo-red to-exyo-red-dark flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.username?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-white text-[16px] font-semibold">{user?.username || 'User'}</h3>
            <p className="text-white/40 text-[13px]">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-exyo-card rounded-2xl border border-white/[0.04] p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-white/50 text-[13px]">{label}</span>
            </div>
            <p className="text-white text-[28px] font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Version */}
      <div className="bg-exyo-card rounded-2xl border border-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[13px]">Version</span>
          <span className="text-white/30 text-[13px] font-mono">1.0.0</span>
        </div>
      </div>
    </div>
  );
}
