import { prisma } from '../server';
import { ensureUserExists } from './clerk-sync.service';

export class UserAddonService {
  static async getAddons(userId: string) {
    await ensureUserExists(userId);
    return prisma.userAddon.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async addAddon(userId: string, url: string) {
    await ensureUserExists(userId);

    const existing = await prisma.userAddon.findUnique({
      where: { userId_url: { userId, url } }
    });

    if (existing) {
      throw new Error('Addon already added');
    }

    let manifest: any = null;
    let name: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        manifest = await response.json();
        name = manifest.name || null;
      }
    } catch {
      // Allow adding addon even if manifest fetch fails
    }

    return prisma.userAddon.create({
      data: {
        userId,
        url,
        name,
        manifest,
        isDefault: false,
      }
    });
  }

  static async removeAddon(userId: string, addonId: string) {
    const addon = await prisma.userAddon.findFirst({
      where: { id: addonId, userId }
    });

    if (!addon) {
      throw new Error('Addon not found');
    }

    if (addon.isDefault) {
      throw new Error('Cannot remove default addons');
    }

    return prisma.userAddon.delete({ where: { id: addonId } });
  }

  static async toggleAddon(userId: string, addonId: string) {
    const addon = await prisma.userAddon.findFirst({
      where: { id: addonId, userId }
    });

    if (!addon) {
      throw new Error('Addon not found');
    }

    if (addon.isDefault) {
      throw new Error('Cannot toggle default addons');
    }

    return prisma.userAddon.update({
      where: { id: addonId },
      data: { active: !addon.active }
    });
  }
}
