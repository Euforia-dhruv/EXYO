import { prisma } from '../server';
import { ensureUserExists } from './user-sync.service';
import { WatchlistInput } from '../types';

export class WatchlistService {
  static async getWatchlist(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    });
  }

  static async addToWatchlist(userId: string, input: WatchlistInput) {
    await ensureUserExists(userId);
    const existing = await prisma.watchlist.findFirst({
      where: {
        userId,
        contentId: input.contentId
      }
    });

    if (existing) {
      throw new Error('Already in watchlist');
    }

    return prisma.watchlist.create({
      data: {
        userId,
        contentId: input.contentId,
        title: input.title,
        posterUrl: input.posterUrl,
        backdropUrl: input.backdropUrl,
        contentType: input.contentType
      }
    });
  }

  static async removeFromWatchlist(userId: string, watchlistId: string) {
    const item = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId
      }
    });

    if (!item) {
      throw new Error('Watchlist item not found');
    }

    return prisma.watchlist.delete({
      where: { id: watchlistId }
    });
  }

  static async isInWatchlist(userId: string, contentId: string) {
    const item = await prisma.watchlist.findFirst({
      where: {
        userId,
        contentId
      }
    });

    return !!item;
  }
}
