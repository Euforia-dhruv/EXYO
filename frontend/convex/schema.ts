import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  watchHistory: defineTable({
    userId: v.string(),
    contentId: v.string(),
    title: v.string(),
    posterUrl: v.optional(v.string()),
    backdropUrl: v.optional(v.string()),
    contentType: v.string(),
    season: v.optional(v.number()),
    episode: v.optional(v.number()),
    progress: v.number(),
    watchedAt: v.number(),
    addonSource: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_user_content", ["userId", "contentId"])
    .index("by_watchedAt", ["watchedAt"]),

  watchlist: defineTable({
    userId: v.string(),
    contentId: v.string(),
    title: v.string(),
    posterUrl: v.optional(v.string()),
    backdropUrl: v.optional(v.string()),
    contentType: v.string(),
    addedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_content", ["userId", "contentId"]),

  searchHistory: defineTable({
    userId: v.string(),
    query: v.string(),
    searchedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_searchedAt", ["searchedAt"]),

  userAddons: defineTable({
    userId: v.string(),
    url: v.string(),
    name: v.optional(v.string()),
    manifest: v.optional(v.any()),
    isDefault: v.boolean(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_url", ["userId", "url"]),
});
