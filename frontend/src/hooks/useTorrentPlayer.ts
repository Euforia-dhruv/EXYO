import { useState, useRef, useCallback, useEffect } from 'react';

interface WTFile {
  name: string;
  path: string;
  length: number;
  type: string;
  streamURL: string;
  streamTo(elem: HTMLVideoElement): void;
  getBlobURL(): string;
  on(event: string, cb: (...args: unknown[]) => void): void;
}

interface WTTorrentInstance {
  infoHash: string;
  name: string;
  files: WTFile[];
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  progress: number;
  downloaded: number;
  uploaded: number;
  ready: boolean;
  destroyed: boolean;
  on(event: string, cb: (...args: unknown[]) => void): void;
  destroy(): void;
}

interface WTClient {
  destroyed: boolean;
  ready: boolean;
  torrents: WTTorrentInstance[];
  add(torrentId: string, opts?: Record<string, unknown>): WTTorrentInstance;
  get(torrentId: string): WTTorrentInstance | null;
  createServer(opts?: Record<string, unknown>): { pathname: string; destroy: () => void };
  on(event: string, cb: (...args: unknown[]) => void): void;
  destroy(cb?: () => void): void;
}

let sharedClient: WTClient | null = null;
let swRegistered = false;
let loadPromise: Promise<WTClient> | null = null;

function loadWebTorrentFromCDN(): Promise<WTClient> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).WebTorrent) {
      const WT = (window as unknown as Record<string, new (opts?: Record<string, unknown>) => WTClient>).WebTorrent;
      resolve(new WT({
        tracker: {
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        },
      }));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@3.0.21/dist/webtorrent.min.js';
    script.async = true;
    script.onload = () => {
      const WT = (window as unknown as Record<string, new (opts?: Record<string, unknown>) => WTClient>).WebTorrent;
      if (!WT) {
        reject(new Error('WebTorrent failed to load'));
        return;
      }
      sharedClient = new WT({
        tracker: {
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        },
      });
      resolve(sharedClient);
    };
    script.onerror = () => reject(new Error('Failed to load WebTorrent from CDN'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistered || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/webtorrent-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    swRegistered = true;
    console.log('[Torrent] Service worker registered, scope:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('[Torrent] Service worker registration failed:', err);
    return null;
  }
}

export interface TorrentState {
  status: 'idle' | 'loading' | 'ready' | 'streaming' | 'error';
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  downloaded: number;
  uploaded: number;
  error: string | null;
}

export function useTorrentPlayer() {
  const [state, setState] = useState<TorrentState>({
    status: 'idle',
    progress: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    downloaded: 0,
    uploaded: 0,
    error: null,
  });

  const torrentRef = useRef<WTTorrentInstance | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (torrentRef.current) {
      try {
        torrentRef.current.destroy();
      } catch {}
      torrentRef.current = null;
    }
  }, []);

  const resolveTorrent = useCallback(async (infoHash: string, element: HTMLVideoElement) => {
    cleanup();

    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    try {
      await ensureServiceWorker();

      const client = await loadWebTorrentFromCDN();

      let torrent: WTTorrentInstance | null = client.get(infoHash);

      if (!torrent) {
        torrent = client.add(infoHash, {
          announce: [
            'wss://tracker.openbittorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.webtorrent.dev',
            'wss://tracker.files.fm:7073/announce',
            'wss://tracker.leechers-paradise.org',
            'wss://tracker.nzbucket.fr',
            'wss://tracker.coppersurfer.tk',
            'wss://tracker.ilithinks.com',
            'wss://tracker.pirateparty.gr',
            'wss://tracker.zerobytes.xyz',
            'wss://tracker.openwebtorrent.com:443/announce',
            'wss://tracker.bot.nu:443/announce',
            'wss://tracker.quickseed.com:443/announce',
            'wss://tracker.seederle.com:443/announce',
            'wss://tracker.coalitionbangula.org:443/announce',
            'wss://tracker.digitalcraft.cloud:443/announce',
            'wss://tracker.lilithraws.org:443/announce',
            'wss://tracker.pussytorrents.org:443/announce',
            'wss://tracker.tamersunion.org:443/announce',
            'wss://tracker.torrent.eu.org:443/announce',
            'wss://tracker.tiny-vps.com:6969/announce',
            'wss://tracker.kuroy.me:443/announce',
            'wss://tracker.loligirl.cn:443/announce',
            'wss://tracker.joinmesh.com:443/announce',
            'wss://tracker.flashtorrents.org:6969/announce',
            'wss://tracker.fdtech.club:443/announce',
            'wss://tracker.cyberia.is:6969/announce',
            'wss://tracker.lomp.fi:80/announce',
            'wss://tracker.army:6881/announce',
            'wss://opentrackr.org:443/announce',
            'wss://tracker.open-tracker.org:1337/announce',
            'wss://tracker.opentrackr.org:1337/announce',
            'wss://tracker.files.fm:7073/announce',
            'wss://bt1.archive.org:6969/announce',
            'wss://bt2.archive.org:6969/announce',
            'wss://explodie.org:6969/announce',
            'wss://tracker.dler.org:6969/announce',
            'wss://tracker.torrent.eu.org:451/announce',
            'wss://tracker.tiny-vps.com:6969/announce',
            'wss://tracker.openbittorrent.com:80/announce',
            'wss://open.stealth.si:80/announce',
            'wss://open.demonii.com:1337/announce',
            'wss://tracker.p4p.arenabg.com:1337/announce',
            'wss://tracker.parrotsec.org:6969/announce',
            'wss://tracker.gmi.gd:6969/announce',
            'wss://tracker.dump.cl:6969/announce',
            'wss://tracker.leechlibre.org:6969/announce',
            'wss://tracker.leech.ie:1337/announce',
            'wss://tracker.lilithraws.org:6969/announce',
            'wss://tracker.internetwarriors.net:1337/announce',
            'wss://tracker.piratebay.org:6969/announce',
            'wss://tracker.uw0.xyz:6969/announce',
            'wss://tracker.bitsearch.to:1337/announce',
            'wss://tracker.gbitt.info:80/announce',
            'wss://tracker.auctor.tv:6969/announce',
            'wss://tracker.leechers-paradise.org:6969/announce',
          ],
        });
      }

      torrentRef.current = torrent;

      await new Promise<void>((resolve, reject) => {
        if (torrent!.ready) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('No peers found — trying next stream'));
        }, 15000);

        torrent!.on('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        torrent!.on('error', (err: unknown) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const videoExtensions = /\.(mp4|mkv|avi|mov|webm|ts|m4v)$/i;
      const videoFiles = torrent!.files.filter((f) => videoExtensions.test(f.name));
      const file = videoFiles.length > 0
        ? videoFiles.sort((a, b) => b.length - a.length)[0]
        : torrent!.files.sort((a, b) => b.length - a.length)[0];

      if (!file) {
        throw new Error('No video files found in torrent');
      }

      try {
        client.createServer({ origin: '*' });
      } catch {}

      if (typeof file.streamTo === 'function') {
        file.streamTo(element);
      } else {
        const blobURL = file.getBlobURL();
        if (blobURL) {
          element.src = blobURL;
          element.play().catch(() => {});
        }
      }

      setState((prev) => ({
        ...prev,
        status: 'streaming',
      }));

      intervalRef.current = setInterval(() => {
        const t = torrentRef.current;
        if (t && !t.destroyed) {
          setState((prev) => ({
            ...prev,
            progress: Math.round((t!.progress || 0) * 100),
            downloadSpeed: t.downloadSpeed,
            uploadSpeed: t.uploadSpeed,
            peers: t.numPeers,
            downloaded: t.downloaded,
            uploaded: t.uploaded,
          }));
        }
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load torrent';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: msg,
      }));
    }
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    resolveTorrent,
    cleanup,
  };
}
