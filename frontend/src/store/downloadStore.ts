import { create } from 'zustand';

export interface Download {
  id: string;
  title: string;
  url: string;
  progress: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'retrying';
  addedAt: number;
  size?: number;
}

interface DownloadState {
  downloads: Download[];
  addDownload: (d: Omit<Download, 'progress' | 'status' | 'addedAt'>) => void;
  removeDownload: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: Download['status']) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  downloads: [],
  addDownload: (d) =>
    set((s) => ({
      downloads: [...s.downloads, { ...d, progress: 0, status: 'queued', addedAt: Date.now() }],
    })),
  removeDownload: (id) =>
    set((s) => ({ downloads: s.downloads.filter((d) => d.id !== id) })),
  updateProgress: (id, progress) =>
    set((s) => ({
      downloads: s.downloads.map((d) => (d.id === id ? { ...d, progress } : d)),
    })),
  updateStatus: (id, status) =>
    set((s) => ({
      downloads: s.downloads.map((d) => (d.id === id ? { ...d, status } : d)),
    })),
}));
