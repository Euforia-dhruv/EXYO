import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DownloadItem {
  id: string;
  contentId: string;
  title: string;
  posterUrl?: string;
  type: 'movie' | 'series';
  season?: number;
  episode?: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'retrying';
  progress: number;
  speed: number;
  eta: string;
  peers: number;
  seeds: number;
  size: string;
  downloaded: string;
  addedAt: number;
  error?: string;
}

interface DownloadState {
  downloads: DownloadItem[];
  maxParallel: number;
  wifiOnly: boolean;
  pauseOnBattery: boolean;
  deleteAfterWatching: boolean;
  autoDownloadNext: boolean;
  prioritizeCurrent: boolean;
  highestQuality: boolean;
  autoSubtitles: boolean;
  downloadLocation: string;
  addDownload: (item: Omit<DownloadItem, 'id' | 'status' | 'progress' | 'speed' | 'eta' | 'peers' | 'seeds' | 'addedAt'>) => string;
  removeDownload: (id: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  retryDownload: (id: string) => void;
  updateProgress: (id: string, progress: number, speed: number, eta: string, peers: number, seeds: number) => void;
  completeDownload: (id: string) => void;
  failDownload: (id: string, error: string) => void;
  setMaxParallel: (n: number) => void;
  setWifiOnly: (v: boolean) => void;
  setPauseOnBattery: (v: boolean) => void;
  setDeleteAfterWatching: (v: boolean) => void;
  setAutoDownloadNext: (v: boolean) => void;
  setPrioritizeCurrent: (v: boolean) => void;
  setHighestQuality: (v: boolean) => void;
  setAutoSubtitles: (v: boolean) => void;
  setDownloadLocation: (v: string) => void;
  getActiveDownloads: () => DownloadItem[];
  getQueuedDownloads: () => DownloadItem[];
  getTotalSpeed: () => number;
}

let downloadCounter = 0;

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: [],
      maxParallel: 3,
      wifiOnly: true,
      pauseOnBattery: true,
      deleteAfterWatching: false,
      autoDownloadNext: false,
      prioritizeCurrent: true,
      highestQuality: true,
      autoSubtitles: true,
      downloadLocation: '/Downloads/EXYO',

      addDownload: (item) => {
        const id = `dl_${Date.now()}_${++downloadCounter}`;
        const newItem: DownloadItem = {
          ...item,
          id,
          status: 'queued',
          progress: 0,
          speed: 0,
          eta: '--:--',
          peers: 0,
          seeds: 0,
          addedAt: Date.now(),
        };
        set((state) => ({ downloads: [...state.downloads, newItem] }));
        return id;
      },

      removeDownload: (id) =>
        set((state) => ({ downloads: state.downloads.filter((d) => d.id !== id) })),

      pauseDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id && (d.status === 'downloading' || d.status === 'queued')
              ? { ...d, status: 'paused' as const }
              : d
          ),
        })),

      resumeDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id && d.status === 'paused'
              ? { ...d, status: 'downloading' as const }
              : d
          ),
        })),

      cancelDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.filter((d) => d.id !== id),
        })),

      retryDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id && d.status === 'failed'
              ? { ...d, status: 'retrying' as const, error: undefined }
              : d
          ),
        })),

      updateProgress: (id, progress, speed, eta, peers, seeds) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id
              ? { ...d, progress, speed, eta, peers, seeds, status: 'downloading' as const }
              : d
          ),
        })),

      completeDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'completed' as const, progress: 100 } : d
          ),
        })),

      failDownload: (id, error) =>
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'failed' as const, error } : d
          ),
        })),

      setMaxParallel: (n) => set({ maxParallel: n }),
      setWifiOnly: (v) => set({ wifiOnly: v }),
      setPauseOnBattery: (v) => set({ pauseOnBattery: v }),
      setDeleteAfterWatching: (v) => set({ deleteAfterWatching: v }),
      setAutoDownloadNext: (v) => set({ autoDownloadNext: v }),
      setPrioritizeCurrent: (v) => set({ prioritizeCurrent: v }),
      setHighestQuality: (v) => set({ highestQuality: v }),
      setAutoSubtitles: (v) => set({ autoSubtitles: v }),
      setDownloadLocation: (v) => set({ downloadLocation: v }),

      getActiveDownloads: () =>
        get().downloads.filter((d) => d.status === 'downloading'),

      getQueuedDownloads: () =>
        get().downloads.filter((d) => d.status === 'queued'),

      getTotalSpeed: () =>
        get().downloads
          .filter((d) => d.status === 'downloading')
          .reduce((sum, d) => sum + d.speed, 0),
    }),
    {
      name: 'exyo-downloads',
    }
  )
);
