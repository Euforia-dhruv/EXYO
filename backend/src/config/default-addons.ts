export const DEFAULT_ADDONS = [
  {
    url: 'https://v3-cinemeta.strem.io/manifest.json',
    name: 'Cinemeta',
    description: 'Official metadata for movies & TV shows',
    type: 'catalog',
  },
  {
    url: 'https://torrentio.strem.fun/manifest.json',
    name: 'Torrentio',
    description: 'Torrent streams from 15+ providers',
    type: 'stream',
  },
  {
    url: 'https://addon.notorrent2.workers.dev/manifest.json',
    name: 'NoTorrent',
    description: 'Streaming catalogs from Netflix, Disney+, etc.',
    type: 'catalog',
  },
  {
    url: 'https://watchhub.strem.io/manifest.json',
    name: 'WatchHub',
    description: 'Streaming availability lookup',
    type: 'stream',
  },
  {
    url: 'https://opensubtitles-v3.strem.io/manifest.json',
    name: 'OpenSubtitles v3',
    description: 'Subtitles for content',
    type: 'subtitles',
  },
  {
    url: 'https://opensubtitles.strem.io/stremio/v1',
    name: 'OpenSubtitles',
    description: 'Backup subtitle provider',
    type: 'subtitles',
  },
  {
    url: 'https://caching.stremio.net/publicdomainmovies.now.sh/manifest.json',
    name: 'Public Domain Movies',
    description: 'Free public domain movies',
    type: 'catalog',
  },
];
