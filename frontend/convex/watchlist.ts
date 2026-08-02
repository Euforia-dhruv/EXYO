import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const checkInWatchlist = query({
  args: { contentId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isInWatchlist: false };

    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", identity.subject).eq("contentId", args.contentId)
      )
      .unique();

    return { isInWatchlist: !!item };
  },
});

export const addToWatchlist = mutation({
  args: {
    contentId: v.string(),
    title: v.string(),
    posterUrl: v.optional(v.string()),
    backdropUrl: v.optional(v.string()),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", identity.subject).eq("contentId", args.contentId)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("watchlist", {
      userId: identity.subject,
      contentId: args.contentId,
      title: args.title,
      posterUrl: args.posterUrl,
      backdropUrl: args.backdropUrl,
      contentType: args.contentType,
      addedAt: Date.now(),
    });
  },
});

export const removeFromWatchlist = mutation({
  args: { id: v.id("watchlist") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== identity.subject) throw new Error("Not found");

    await ctx.db.delete(args.id);
  },
});
