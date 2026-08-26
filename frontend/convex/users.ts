import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", identity.subject))
      .unique();

    return user;
  },
});

export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required" };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", identity.subject))
      .unique();

    if (existing) {
      const updates: { email?: string; displayName?: string; avatarUrl?: string } = {};
      if (identity.email && String(identity.email) !== existing.email) updates.email = String(identity.email);
      if (identity.name && String(identity.name) !== existing.displayName) updates.displayName = String(identity.name);
      if (identity.picture && String(identity.picture) !== existing.avatarUrl) updates.avatarUrl = String(identity.picture);

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
      return { ok: true as const, userId: existing._id, created: false };
    }

    const userId = await ctx.db.insert("users", {
      googleId: identity.subject,
      email: (identity.email as string) ?? "",
      username: (identity.username as string) ?? undefined,
      displayName: (identity.name as string) ?? undefined,
      avatarUrl: (identity.picture as string) ?? undefined,
    });

    const defaultAddons = [
      { url: "https://v3-cinemeta.strem.io/manifest.json", name: "Cinemeta" },
      { url: "https://torrentio.strem.fun/manifest.json", name: "Torrentio" },
      { url: "https://watchhub.strem.io/manifest.json", name: "WatchHub" },
      { url: "https://opensubtitles-v3.strem.io/manifest.json", name: "OpenSubtitles v3" },
      { url: "https://opensubtitles.strem.io/stremio/v1", name: "OpenSubtitles" },
      { url: "https://caching.stremio.net/publicdomainmovies.now.sh/manifest.json", name: "Public Domain Movies" },
    ];

    for (const addon of defaultAddons) {
      await ctx.db.insert("userAddons", {
        userId: identity.subject,
        url: addon.url,
        name: addon.name,
        isDefault: true,
        active: true,
        createdAt: Date.now(),
      });
    }

    return { ok: true as const, userId, created: true };
  },
});

export const updateProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false as const, error: "Authentication required" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", identity.subject))
      .unique();

    if (!user) {
      return { ok: false as const, error: "User not found" };
    }

    await ctx.db.patch(user._id, { displayName: args.displayName });
    return { ok: true as const };
  },
});
