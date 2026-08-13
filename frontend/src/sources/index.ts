export { SourceManager } from "./manager";
export { getSourceManager, addUserAddons, parseAddonUrls, resetSourceManager } from "./registry";
export { StremioAddonAdapter } from "./adapters/stremioAddon";
export * from "./types";
export {
  normalizeMetaToContentItem,
  normalizeStream,
  normalizeSubtitle,
  dedupeContentItems,
  dedupeStreams,
  dedupeSubtitles,
  rankStreams,
  rankContentItems,
} from "./utils/normalize";
