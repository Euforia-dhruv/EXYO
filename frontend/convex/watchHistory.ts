import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContinueWatching = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(20);
  },
});

export const getHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 20;

    return await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
  },
});

export const addOrUpdate = mutation({
  args: {
    contentId: v.string(),
    title: v.string(),
    posterUrl: v.optional(v.string()),
    backdropUrl: v.optional(v.string()),
    contentType: v.string(),
    season: v.optional(v.number()),
    episode: v.optional(v.number()),
    progress: v.number(),
    addonSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", identity.subject).eq("contentId", args.contentId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        progress: args.progress,
        watchedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("watchHistory", {
      userId: identity.subject,
      contentId: args.contentId,
      title: args.title,
      posterUrl: args.posterUrl,
      backdropUrl: args.backdropUrl,
      contentType: args.contentType,
      season: args.season,
      episode: args.episode,
      progress: args.progress,
      watchedAt: Date.now(),
      addonSource: args.addonSource,
    });
  },
});

export const deleteItem = mutation({
  args: { id: v.id("watchHistory") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== identity.subject) throw new Error("Not found");

    await ctx.db.delete(args.id);
  },
});

export const clearHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
