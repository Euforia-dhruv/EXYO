import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAddons = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("userAddons")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const addAddon = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userAddons")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", identity.subject).eq("url", args.url)
      )
      .unique();

    if (existing) throw new Error("Addon already added");

    let manifest: any = null;
    let name: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(args.url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        manifest = await response.json();
        name = manifest.name || null;
      }
    } catch {
      // Allow adding addon even if manifest fetch fails
    }

    return await ctx.db.insert("userAddons", {
      userId: identity.subject,
      url: args.url,
      name,
      manifest,
      isDefault: false,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const removeAddon = mutation({
  args: { id: v.id("userAddons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const addon = await ctx.db.get(args.id);
    if (!addon || addon.userId !== identity.subject) throw new Error("Addon not found");
    if (addon.isDefault) throw new Error("Cannot remove default addons");

    await ctx.db.delete(args.id);
  },
});

export const toggleAddon = mutation({
  args: { id: v.id("userAddons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const addon = await ctx.db.get(args.id);
    if (!addon || addon.userId !== identity.subject) throw new Error("Addon not found");
    if (addon.isDefault) throw new Error("Cannot toggle default addons");

    await ctx.db.patch(args.id, { active: !addon.active });
    return await ctx.db.get(args.id);
  },
});
