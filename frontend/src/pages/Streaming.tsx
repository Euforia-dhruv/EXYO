import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, CheckCircle2, Loader2, Wifi, WifiOff, Plus, X } from 'lucide-react';
import { cn } from '../utils/helpers';
import { contentApi, type AddonManifest } from '../api/content.api';

const PROXY_OPTIONS = [
  { id: 'workers', label: 'Workers Proxy', desc: 'Fast — Cloudflare Workers', url: 'https://exyo.cc.cd' },
  { id: 'vercel', label: 'Vercel Proxy', desc: 'Recommended', url: 'https://exyo.vercel.app/api/proxy' },
  { id: 'direct', label: 'Direct', desc: 'No proxy', url: '' },
];

const ADDON_OPTIONS = [
  { id: 'torrentio', label: 'Torrentio', desc: '4K HDR/DV torrents from 10+ providers (debrid required)', url: 'https://torrentio.strem.fun' },
  { id: 'mediafusion', label: 'MediaFusion', desc: 'Universal addon: movies, series, live TV, sports (50+ languages)', url: 'https://mediafusion.elfhosted.com' },
  { id: 'comet', label: 'Comet', desc: 'Fastest torrent/debrid/usenet search addon', url: 'https://comet.elfhosted.com' },
  { id: 'pengu', label: 'PenguPlay', desc: 'Movies & TV streams (4K/HD)', url: 'https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D' },
  { id: 'nuvio', label: 'Nuvio Streams', desc: 'Multi-provider HTTP streams (4K/HD/HDR)', url: 'https://nuviostreams.hayd.uk' },
  { id: 'anime', label: 'AnimeStream', desc: 'Anime catalog, streams & metadata', url: 'https://animestream-addon.keypop3750.workers.dev' },
  { id: 'flix', label: 'Flix-Streams', desc: 'Movies, series & live TV', url: 'https://free.flixnest.app' },
  { id: 'notorrent', label: 'NoTorrent', desc: 'Movies & series streams (free + premium)', url: 'https://addon.notorrent2.workers.dev' },
  { id: 'aiocatalogs', label: 'AIOCatalogs', desc: 'Additional movie catalogs', url: 'https://aio.pantelx.com' },
];

function AddonBadge({ manifest }: { manifest?: AddonManifest | null; enabled: boolean }) {
  if (!manifest) return null;

  const resourceNames: string[] = [];
  const res = manifest.resources;
  if (Array.isArray(res)) {
    for (const r of res) {
      if (typeof r === 'string') resourceNames.push(r);
      else if (r && typeof r === 'object' && 'name' in r) resourceNames.push((r as any).name);
    }
  }

  const catalogList = (manifest.catalogs || []).map((c) => c.name);
  const typeList = (manifest.types || []).filter(Boolean) as string[];

  return (
    <div className="mt-2 space-y-1.5">
      {typeList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {typeList.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.06] text-white/50 border border-white/[0.04]">
              {t}
            </span>
          ))}
        </div>
      )}
      {resourceNames.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <Wifi className="w-3 h-3" />
          <span>{resourceNames.join(', ')}</span>
        </div>
      )}
      {catalogList.length > 0 && (
        <p className="text-[10px] text-white/25">
          Catalogs: {catalogList.slice(0, 5).join(', ')}{catalogList.length > 5 ? ` +${catalogList.length - 5} more` : ''}
        </p>
      )}
    </div>
  );
}

export default function Streaming() {
  const [proxy, setProxy] = useState('vercel');
  const [addons, setAddons] = useState(['pengu', 'nuvio', 'anime', 'flix']);
  const [customAddons, setCustomAddons] = useState<string[]>([]);
  const [newAddonUrl, setNewAddonUrl] = useState('');
  const [addonError, setAddonError] = useState('');

  useEffect(() => {
    try {
      const sp = localStorage.getItem('exyo-proxy');
      if (sp) setProxy(sp);
      const sa = localStorage.getItem('exyo-addons');
      if (sa) setAddons(JSON.parse(sa));
      const ca = localStorage.getItem('exyo-custom-addons');
      if (ca) setCustomAddons(JSON.parse(ca));
    } catch {}
  }, []);

  const { data: manifests, isLoading: manifestsLoading } = useQuery({
    queryKey: ['addonManifests', customAddons],
    queryFn: () => contentApi.getManifests(customAddons.length > 0 ? customAddons : undefined),
    staleTime: 5 * 60 * 1000,
  });

  const manifestMap = new Map<string, AddonManifest>();
  if (manifests) {
    for (const m of manifests) {
      manifestMap.set(m.addonUrl, m);
    }
  }

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
        {manifestsLoading && (
          <div className="flex items-center gap-2 text-white/30 text-xs mb-3">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading addon info...</span>
          </div>
        )}
        <div className="space-y-2">
          {ADDON_OPTIONS.map(({ id, label, desc, url }) => {
            const enabled = addons.includes(id);
            const manifest = manifestMap.get(url);
            return (
              <button
                key={id}
                onClick={() => {
                  const next = enabled ? addons.filter((a) => a !== id) : [...addons, id];
                  setAddons(next);
                  localStorage.setItem('exyo-addons', JSON.stringify(next));
                }}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between',
                  enabled ? 'bg-white/[0.06] border-red/20' : 'bg-card border-white/[0.04] hover:border-white/[0.08]'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{label}</p>
                    {manifest ? (
                      <Wifi className="w-3 h-3 text-green-400 shrink-0" />
                    ) : !manifestsLoading ? (
                      <WifiOff className="w-3 h-3 text-red/50 shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                  <AddonBadge manifest={manifest} enabled={enabled} />
                </div>
                <div className={cn(
                  'w-11 h-6 rounded-full transition-all relative shrink-0 mt-1',
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

      <div className="mt-8">
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Custom Addons</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="url"
            value={newAddonUrl}
            onChange={(e) => { setNewAddonUrl(e.target.value); setAddonError(''); }}
            placeholder="https://example.com/manifest.json"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red/30"
          />
          <button
            onClick={() => {
              const url = newAddonUrl.trim();
              if (!url) { setAddonError('Enter a manifest URL'); return; }
              try { new URL(url); } catch { setAddonError('Invalid URL'); return; }
              if (customAddons.includes(url)) { setAddonError('Already added'); return; }
              const next = [...customAddons, url];
              setCustomAddons(next);
              localStorage.setItem('exyo-custom-addons', JSON.stringify(next));
              setNewAddonUrl('');
              setAddonError('');
            }}
            className="bg-red hover:bg-red/80 text-white px-4 rounded-xl transition-all flex items-center gap-1.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {addonError && <p className="text-red/70 text-xs mb-2">{addonError}</p>}
        {customAddons.length > 0 && (
          <div className="space-y-2">
            {customAddons.map((url) => {
              const manifest = manifestMap.get(url.replace(/\/$/, ''));
              const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
              return (
                <div
                  key={url}
                  className="w-full text-left p-4 rounded-2xl border bg-white/[0.06] border-red/20 flex items-start justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{String(manifest?.name || host)}</p>
                      {manifest ? (
                        <Wifi className="w-3 h-3 text-green-400 shrink-0" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-red/50 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{url}</p>
                    <AddonBadge manifest={manifest} enabled={true} />
                  </div>
                  <button
                    onClick={() => {
                      const next = customAddons.filter((u) => u !== url);
                      setCustomAddons(next);
                      localStorage.setItem('exyo-custom-addons', JSON.stringify(next));
                    }}
                    className="text-white/30 hover:text-red transition-colors p-1 shrink-0 mt-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
