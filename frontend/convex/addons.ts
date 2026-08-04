import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const MANIFEST_TIMEOUT_MS = 10000;

async function fetchManifest(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MANIFEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("Response is not valid JSON");
    }
  } finally {
    clearTimeout(timer);
  }
}

function extractAddonInfo(manifest: Record<string, unknown>) {
  const id = manifest.id ?? manifest.version ?? "";
  const name =
    (manifest.name as string | undefined) ??
    (typeof id === "string" ? id.split(".").pop() ?? "Unknown Addon" : "Unknown Addon");
  const description = (manifest.description as string | undefined) ?? "";
  const version = (manifest.version as string | undefined) ?? "";
  const types = Array.isArray(manifest.types) ? (manifest.types as string[]) : [];
  return { id, name, description, version, types };
}

function validateManifestUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return "URL must use HTTP or HTTPS";
    if (!parsed.pathname.endsWith("/manifest.json") && !parsed.pathname.endsWith("/v1")) {
      // Allow it but warn — many addons don't end with manifest.json
    }
    return null;
  } catch {
    return "Invalid URL format";
  }
}

// ─────────────────────────────────────────────────────────────
// GET ADDONS
// ─────────────────────────────────────────────────────────────
export const getAddons = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const addons = await ctx.db
      .query("userAddons")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return addons.map((a) => ({
      _id: a._id,
      name: a.name,
      url: a.url,
      active: a.active,
      isDefault: a.isDefault,
      createdAt: a.createdAt,
    }));
  },
});

// ─────────────────────────────────────────────────────────────
// ADD ADDON
// ─────────────────────────────────────────────────────────────
export const addAddon = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required. Please sign in again." };
    }

    const urlError = validateManifestUrl(args.url);
    if (urlError) {
      return { ok: false as const, error: urlError };
    }

    const existing = await ctx.db
      .query("userAddons")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", identity.subject).eq("url", args.url)
      )
      .unique();
    if (existing) {
      return { ok: false as const, error: "This addon is already installed." };
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = await fetchManifest(args.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("abort")) {
        return { ok: false as const, error: "Addon server timed out. Please try again later." };
      }
      return { ok: false as const, error: `Could not fetch manifest: ${msg}` };
    }

    if (!manifest || typeof manifest !== "object" || !("id" in manifest)) {
      return {
        ok: false as const,
        error: "Invalid manifest: missing 'id' field. Is this a valid Stremio addon?",
      };
    }

    const info = extractAddonInfo(manifest);

    const addonId = await ctx.db.insert("userAddons", {
      userId: identity.subject,
      url: args.url,
      name: info.name,
      description: info.description,
      manifestId: String(info.id),
      manifestVersion: info.version,
      manifestTypes: info.types,
      active: true,
      isDefault: false,
      createdAt: Date.now(),
    });

    return { ok: true as const, addonId, name: info.name };
  },
});

// ─────────────────────────────────────────────────────────────
// REMOVE ADDON
// ─────────────────────────────────────────────────────────────
export const removeAddon = mutation({
  args: { id: v.id("userAddons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required. Please sign in again." };
    }

    const addon = await ctx.db.get(args.id);
    if (!addon) {
      return { ok: false as const, error: "Addon not found." };
    }

    if (addon.userId !== identity.subject) {
      return { ok: false as const, error: "You don't have permission to remove this addon." };
    }

    await ctx.db.delete(args.id);
    return { ok: true as const };
  },
});

// ─────────────────────────────────────────────────────────────
// TOGGLE ADDON
// ─────────────────────────────────────────────────────────────
export const toggleAddon = mutation({
  args: { id: v.id("userAddons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required. Please sign in again." };
    }

    const addon = await ctx.db.get(args.id);
    if (!addon) {
      return { ok: false as const, error: "Addon not found." };
    }

    if (addon.userId !== identity.subject) {
      return { ok: false as const, error: "You don't have permission to modify this addon." };
    }

    await ctx.db.patch(args.id, { active: !addon.active });
    return { ok: true as const, active: !addon.active };
  },
});

// ─────────────────────────────────────────────────────────────
// REORDER ADDONS
// ─────────────────────────────────────────────────────────────
export const reorderAddons = mutation({
  args: { addonIds: v.array(v.id("userAddons")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required." };
    }

    // Verify all addons belong to this user
    for (const id of args.addonIds) {
      const addon = await ctx.db.get(id);
      if (!addon || addon.userId !== identity.subject) {
        return { ok: false as const, error: "Invalid addon in reorder list." };
      }
    }

    // Reorder by updating createdAt to maintain order
    for (let i = 0; i < args.addonIds.length; i++) {
      await ctx.db.patch(args.addonIds[i], { createdAt: Date.now() - (args.addonIds.length - i) });
    }

    return { ok: true as const };
  },
});

// ─────────────────────────────────────────────────────────────
// CHECK ADDON HEALTH
// ─────────────────────────────────────────────────────────────
export const checkAddonHealth = mutation({
  args: { id: v.id("userAddons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required." };
    }

    const addon = await ctx.db.get(args.id);
    if (!addon) {
      return { ok: false as const, error: "Addon not found." };
    }

    if (addon.userId !== identity.subject) {
      return { ok: false as const, error: "Not your addon." };
    }

    try {
      await fetchManifest(addon.url);
      return { ok: true as const, healthy: true };
    } catch {
      return { ok: true as const, healthy: false };
    }
  },
});
