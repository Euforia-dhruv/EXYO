import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/helpers';

const PROXY_OPTIONS = [
  { id: 'vercel', label: 'Vercel Proxy', desc: 'Recommended', url: 'https://exyo.vercel.app/api/proxy' },
  { id: 'direct', label: 'Direct', desc: 'No proxy', url: '' },
];

const ADDON_OPTIONS = [
  { id: 'pengu', label: 'PenguPlay', desc: 'Movies & TV', url: 'https://pengu.uk' },
  { id: 'anime', label: 'AnimeStream', desc: '7,000+ anime', url: 'https://animestream-addon.keypop3750.workers.dev' },
  { id: 'flix', label: 'Flix-Streams', desc: 'Movies & series', url: 'https://free.flixnest.app' },
];

export default function Streaming() {
  const [proxy, setProxy] = useState('vercel');
  const [addons, setAddons] = useState(['pengu', 'anime', 'flix']);

  useEffect(() => {
    try {
      const sp = localStorage.getItem('exyo-proxy');
      if (sp) setProxy(sp);
      const sa = localStorage.getItem('exyo-addons');
      if (sa) setAddons(JSON.parse(sa));
    } catch {}
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Radio className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Streaming</h1>
      </div>

      <div className="mb-8">
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Proxy</h3>
        <div className="space-y-2">
          {PROXY_OPTIONS.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => { setProxy(id); localStorage.setItem('exyo-proxy', id); }}
              className={cn(
                'w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between',
                proxy === id
                  ? 'bg-white/[0.06] border-red/20'
                  : 'bg-card border-white/[0.04] hover:border-white/[0.08]'
              )}
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/30 mt-0.5">{desc}</p>
              </div>
              {proxy === id && <CheckCircle2 className="w-5 h-5 text-red shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Addons</h3>
        <div className="space-y-2">
          {ADDON_OPTIONS.map(({ id, label, desc }) => {
            const enabled = addons.includes(id);
            return (
              <button
                key={id}
                onClick={() => {
                  const next = enabled ? addons.filter((a) => a !== id) : [...addons, id];
                  setAddons(next);
                  localStorage.setItem('exyo-addons', JSON.stringify(next));
                }}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between',
                  enabled ? 'bg-white/[0.06] border-red/20' : 'bg-card border-white/[0.04] hover:border-white/[0.08]'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                </div>
                <div className={cn(
                  'w-11 h-6 rounded-full transition-all relative shrink-0',
                  enabled ? 'bg-red' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                    enabled ? 'left-6' : 'left-1'
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
