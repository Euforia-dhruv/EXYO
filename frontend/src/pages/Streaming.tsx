import { useState, useEffect } from 'react';
import { Cog6ToothIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/helpers';

const PROXY_OPTIONS = [
  { id: 'vercel', label: 'Vercel Proxy (Recommended)', url: 'https://exyo.vercel.app/api/proxy' },
  { id: 'direct', label: 'Direct Connection', url: '' },
];

const ADDON_OPTIONS = [
  { id: 'pengu', label: 'PenguPlay', url: 'https://pengu.uk', description: 'Movies & TV shows' },
  { id: 'anime', label: 'AnimeStream', url: 'https://animestream-addon.keypop3750.workers.dev', description: '7,000+ anime titles' },
  { id: 'flix', label: 'Flix-Streams Free', url: 'https://free.flixnest.app', description: 'Movies & series (HDHub, Dailymotion)' },
];

export default function Streaming() {
  const [proxy, setProxy] = useState('vercel');
  const [customProxy, setCustomProxy] = useState('');
  const [enabledAddons, setEnabledAddons] = useState(['pengu', 'anime', 'flix']);

  useEffect(() => {
    const saved = localStorage.getItem('exyo-proxy');
    if (saved) setProxy(saved);
    const savedCustom = localStorage.getItem('exyo-custom-proxy');
    if (savedCustom) setCustomProxy(savedCustom);
    const savedAddons = localStorage.getItem('exyo-addons');
    if (savedAddons) setEnabledAddons(JSON.parse(savedAddons));
  }, []);

  const handleProxyChange = (id: string) => {
    setProxy(id);
    localStorage.setItem('exyo-proxy', id);
  };

  const handleCustomProxyChange = (url: string) => {
    setCustomProxy(url);
    localStorage.setItem('exyo-custom-proxy', url);
  };

  const toggleAddon = (id: string) => {
    const next = enabledAddons.includes(id)
      ? enabledAddons.filter((a) => a !== id)
      : [...enabledAddons, id];
    setEnabledAddons(next);
    localStorage.setItem('exyo-addons', JSON.stringify(next));
  };

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">Streaming</h2>

      {/* Proxy */}
      <div className="mb-8">
        <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Stream Proxy</h3>
        <div className="space-y-2">
          {PROXY_OPTIONS.map(({ id, label, url }) => (
            <button
              key={id}
              onClick={() => handleProxyChange(id)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between',
                proxy === id
                  ? 'bg-white/[0.06] border-exyo-red/20'
                  : 'bg-exyo-card border-white/[0.04] hover:border-white/[0.08]'
              )}
            >
              <div>
                <p className="text-white text-[13px] font-medium">{label}</p>
                {url && <p className="text-white/30 text-[11px] font-mono mt-0.5">{url}</p>}
              </div>
              {proxy === id && <CheckCircleIcon className="w-5 h-5 text-exyo-red shrink-0" />}
            </button>
          ))}
        </div>

        {/* Custom proxy URL */}
        {proxy === 'vercel' && (
          <div className="mt-3">
            <input
              type="url"
              value={customProxy}
              onChange={(e) => handleCustomProxyChange(e.target.value)}
              placeholder="Custom proxy URL (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-exyo-red/40 transition-colors font-mono"
            />
          </div>
        )}
      </div>

      {/* Addons */}
      <div>
        <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Stream Addons</h3>
        <div className="space-y-2">
          {ADDON_OPTIONS.map(({ id, label, url, description }) => {
            const enabled = enabledAddons.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleAddon(id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between',
                  enabled
                    ? 'bg-white/[0.06] border-exyo-red/20'
                    : 'bg-exyo-card border-white/[0.04] hover:border-white/[0.08]'
                )}
              >
                <div>
                  <p className="text-white text-[13px] font-medium">{label}</p>
                  <p className="text-white/30 text-[11px] mt-0.5">{description}</p>
                  <p className="text-white/20 text-[10px] font-mono mt-0.5 truncate max-w-[280px]">{url}</p>
                </div>
                <div className={cn(
                  'w-10 h-6 rounded-full transition-all duration-200 relative shrink-0',
                  enabled ? 'bg-exyo-red' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200',
                    enabled ? 'left-5' : 'left-1'
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
