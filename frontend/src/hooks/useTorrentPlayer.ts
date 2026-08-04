import { useState, useEffect, useRef, useCallback } from 'react';
import WebTorrent from 'webtorrent';

type WTTorrent = InstanceType<typeof WebTorrent>;

let sharedClient: WTTorrent | null = null;
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

function getOrCreateClient(): WTTorrent {
  if (sharedClient && !sharedClient.destroyed) return sharedClient;

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

  const torrentRef = useRef<InstanceType<typeof WebTorrent>['torrents'][0] | null>(null);
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

      const client = getOrCreateClient();

      // Check if torrent already exists
      let torrent = client.get(infoHash) as typeof torrentRef.current;

      if (!torrent) {
        torrent = client.add(infoHash, {
          announce: [
            'wss://tracker.openbittorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.webtorrent.dev',
            'wss://tracker.files.fm:7073/announce',
          ],
        }) as typeof torrentRef.current;
      }

      torrentRef.current = torrent;

      // Wait for metadata (file listing)
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

      // Find the largest video file
      const videoExtensions = /\.(mp4|mkv|avi|mov|webm|ts|m4v)$/i;
      const files = torrent!.files as Array<{ name: string; length: number; streamTo: (el: HTMLVideoElement) => void }>;
      const videoFiles = files.filter((f) => videoExtensions.test(f.name));
      const file = videoFiles.length > 0
        ? videoFiles.sort((a, b) => b.length - a.length)[0]
        : files.sort((a, b) => b.length - a.length)[0];

      if (!file) {
        throw new Error('No video files found in torrent');
      }

      // Create server if not already created
      try {
        client.createServer({ origin: '*' });
      } catch {
        // Server already exists
      }

      // Start streaming to the video element
      file.streamTo(element);

      setState((prev) => ({
        ...prev,
        status: 'streaming',
      }));

      // Update stats periodically
      intervalRef.current = setInterval(() => {
        const t = torrentRef.current;
        if (t && !t.destroyed) {
          setState((prev) => ({
            ...prev,
            progress: Math.round((t as Record<string, unknown>['progress'] as number) * 100 || 0),
            downloadSpeed: (t as unknown as { downloadSpeed: number }).downloadSpeed,
            uploadSpeed: (t as unknown as { uploadSpeed: number }).uploadSpeed,
            peers: (t as unknown as { numPeers: number }).numPeers,
            downloaded: (t as unknown as { downloaded: number }).downloaded,
            uploaded: (t as unknown as { uploaded: number }).uploaded,
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
