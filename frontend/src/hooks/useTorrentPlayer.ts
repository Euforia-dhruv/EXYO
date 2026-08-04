import { useState, useRef, useCallback, useEffect } from 'react';

interface WTFile {
  name: string;
  path: string;
  length: number;
  type: string;
  streamURL: string;
  streamTo(elem: HTMLVideoElement): void;
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

let WTConstructor: (new (opts?: Record<string, unknown>) => WTClient) | null = null;

async function loadWebTorrent(): Promise<new (opts?: Record<string, unknown>) => WTClient> {
  if (!WTConstructor) {
    const mod = await import('webtorrent');
    WTConstructor = mod.default as unknown as new (opts?: Record<string, unknown>) => WTClient;
  }
  return WTConstructor;
}

let sharedClient: WTClient | null = null;
let swRegistered = false;

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

async function getOrCreateClient(): Promise<WTClient> {
  if (sharedClient && !sharedClient.destroyed) return sharedClient;

  const WebTorrent = await loadWebTorrent();
  sharedClient = new WebTorrent({
    tracker: {
      rtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    },
  });

  return sharedClient;
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

      const client = await getOrCreateClient();

      let torrent: WTTorrentInstance | null = client.get(infoHash);

      if (!torrent) {
        torrent = client.add(infoHash, {
          announce: [
            'wss://tracker.openbittorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.webtorrent.dev',
            'wss://tracker.files.fm:7073/announce',
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
          reject(new Error('Torrent metadata timeout (30s)'));
        }, 30000);

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

      file.streamTo(element);

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
