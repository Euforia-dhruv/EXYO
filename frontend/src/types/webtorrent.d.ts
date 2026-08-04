declare module 'webtorrent' {
  interface TorrentFile {
    name: string;
    path: string;
    length: number;
    type: string;
    streamURL: string;
    streamTo(elem: HTMLVideoElement): void;
    on(event: string, cb: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
  }

  interface Torrent {
    infoHash: string;
    name: string;
    files: TorrentFile[];
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
    progress: number;
    downloaded: number;
    uploaded: number;
    ready: boolean;
    destroyed: boolean;
    on(event: string, cb: (...args: unknown[]) => void): void;
    destroy(cb?: () => void): void;
  }

  interface WebTorrentOptions {
    tracker?: {
      rtcConfig?: RTCConfiguration;
    };
    peerId?: string;
    nodeId?: string;
    userAgent?: string;
    torrentPort?: number;
    dhtPort?: number;
    tracker?: Record<string, unknown>;
    lsd?: boolean;
    utPex?: boolean;
  }

  class WebTorrent {
    constructor(opts?: WebTorrentOptions);
    destroyed: boolean;
    ready: boolean;
    torrents: Torrent[];
    add(torrentId: string, opts?: Record<string, unknown>): Torrent;
    get(torrentId: string): Torrent | null;
    createServer(opts?: Record<string, unknown>): { pathname: string; destroy: () => void };
    on(event: string, cb: (...args: unknown[]) => void): void;
    destroy(cb?: () => void): void;
  }

  export default WebTorrent;
  export { Torrent, TorrentFile, WebTorrentOptions };
}
