import { SourceManager } from "./manager";
import { StremioAddonAdapter } from "./adapters/stremioAddon";
import type { SourceConfig } from "./types";

// ─────────────────────────────────────────────────────────────
// Built-in addon configurations
// ─────────────────────────────────────────────────────────────
const BUILTIN_ADDONS: SourceConfig[] = [
  {
    id: "cinepro",
    name: "CinePro",
    baseUrl: "https://cinepro-core-bt64.onrender.com/stremio",
    type: "stremio",
    enabled: true,
    priority: 11,
  },
  {
    id: "cinemeta",
    name: "Cinemeta",
    baseUrl: "https://v3-cinemeta.strem.io",
    type: "stremio",
    enabled: true,
    priority: 10,
  },
  {
    id: "tmdb",
    name: "TMDB Addon",
    baseUrl: "https://94c8cb9f702d-tmdb-addon.baby-beamup.club",
    type: "stremio",
    enabled: true,
    priority: 9,
  },
  {
    id: "pengu",
    name: "PenguPlay",
    baseUrl: "https://pengu.uk",
    type: "stremio",
    enabled: true,
    priority: 7,
    auth: "Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0",
  },
  {
    id: "animestream",
    name: "AnimeStream",
    baseUrl: "https://animestream-addon.keypop3750.workers.dev",
    type: "stremio",
    enabled: true,
    priority: 6,
  },
  {
    id: "flixnest",
    name: "FlixNest",
    baseUrl: "https://free.flixnest.app",
    type: "stremio",
    enabled: true,
    priority: 5,
  },
  {
    id: "notorrent",
    name: "NoTorrent",
    baseUrl: "https://addon.notorrent2.workers.dev",
    type: "stremio",
    enabled: true,
    priority: 4,
  },
  {
    id: "nuvio",
    name: "NuvioStreams",
    baseUrl: "https://nuviostreams.hayd.uk",
    type: "stremio",
    enabled: true,
    priority: 3,
  },
  {
    id: "aiocatalogs",
    name: "AIO Catalogs",
    baseUrl: "https://aio.pantelx.com",
    type: "stremio",
    enabled: true,
    priority: 2,
  },
];

// ─────────────────────────────────────────────────────────────
// Singleton source manager
// ─────────────────────────────────────────────────────────────
let _manager: SourceManager | null = null;

function extractAddonAuth(addonUrl: string): string {
  try {
    const parsed = new URL(addonUrl);
    const decoded = decodeURIComponent(parsed.pathname + parsed.search);
    const tokenMatch = decoded.match(/auth_token['":\s]+([A-Za-z0-9_-]+)/);
    if (tokenMatch) return tokenMatch[1];
  } catch {}
  return "";
}

export function getSourceManager(): SourceManager {
  if (_manager) return _manager;

  _manager = new SourceManager();

  // Register built-in addons
  for (const config of BUILTIN_ADDONS) {
    const auth = config.auth || extractAddonAuth(config.baseUrl);
    const source = new StremioAddonAdapter({
      id: config.id,
      name: config.name,
      baseUrl: config.baseUrl,
      enabled: config.enabled,
      priority: config.priority,
      auth: auth || undefined,
    });
    _manager.addSource(source);
  }

  return _manager;
}

// ─────────────────────────────────────────────────────────────
// Add user-configured addon URLs
// ─────────────────────────────────────────────────────────────
export function addUserAddons(addonUrls: string[]): SourceManager {
  const manager = getSourceManager();

  for (const url of addonUrls) {
    const base = url.replace(/\/$/, "");
    const id = `user-${new URL(base).hostname.replace(/\./g, "-")}`;

    // Skip if already registered
    if (manager.getSource(id)) continue;

    const auth = extractAddonAuth(url);
    const source = new StremioAddonAdapter({
      id,
      name: new URL(base).hostname,
      baseUrl: base,
      enabled: true,
      priority: 1,
      auth: auth || undefined,
    });
    manager.addSource(source);
  }

  return manager;
}

// ─────────────────────────────────────────────────────────────
// Parse addon URLs from comma-separated param
// ─────────────────────────────────────────────────────────────
export function parseAddonUrls(addonsParam: string | null): string[] {
  if (!addonsParam) return [];
  return addonsParam.split(",").filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Reset manager (for testing)
// ─────────────────────────────────────────────────────────────
export function resetSourceManager(): void {
  _manager = null;
}
