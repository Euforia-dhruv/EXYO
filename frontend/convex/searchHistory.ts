import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(10);
  },
});

export const saveSearch = mutation({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("searchHistory", {
      userId: identity.subject,
      query: args.query,
      searchedAt: Date.now(),
    });
  },
});

export const clearSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
