import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: (identity.email as string) ?? existing.email,
        displayName: (identity.name as string) ?? existing.displayName,
        avatarUrl: (identity.picture as string) ?? existing.avatarUrl,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: (identity.email as string) ?? "",
      username: (identity.username as string) ?? undefined,
      displayName: (identity.name as string) ?? undefined,
      avatarUrl: (identity.picture as string) ?? undefined,
    });

    const defaultAddons = [
      { url: "https://v3-cinemeta.strem.io/manifest.json", name: "Cinemeta" },
      { url: "https://torrentio.strem.fun/manifest.json", name: "Torrentio" },
      { url: "https://addon.notorrent2.workers.dev/manifest.json", name: "NoTorrent" },
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

    return userId;
  },
});

export const updateProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { displayName: args.displayName });
  },
});
