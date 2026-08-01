import { prisma } from '../server';
import { WatchHistoryInput } from '../types';

export class HistoryService {
  static async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.watchHistory.count({
        where: { userId }
      })
    ]);

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getContinueWatching(userId: string) {
    const history = await prisma.watchHistory.findMany({
      where: {
        userId,
        progress: { lt: 100 }
      },
      orderBy: { watchedAt: 'desc' },
      take: 20
    });

    return history;
  }

  static async addOrUpdateHistory(userId: string, input: WatchHistoryInput) {
    const whereClause: any = {
      userId,
      contentId: input.contentId,
      season: input.season || null,
      episode: input.episode || null
    };

    const existing = await prisma.watchHistory.findFirst({
      where: whereClause
    });

    if (existing) {
      return prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: input.progress,
          watchedAt: new Date(),
          title: input.title,
          posterUrl: input.posterUrl,
          backdropUrl: input.backdropUrl
        }
      });
    }

    return prisma.watchHistory.create({
      data: {
        userId,
        contentId: input.contentId,
        title: input.title,
        posterUrl: input.posterUrl,
        backdropUrl: input.backdropUrl,
        contentType: input.contentType,
        season: input.season,
        episode: input.episode,
        progress: input.progress,
        addonSource: input.addonSource
      }
    });
  }

  static async updateProgress(userId: string, historyId: string, progress: number) {
    const history = await prisma.watchHistory.findFirst({
      where: {
        id: historyId,
        userId
      }
    });

    if (!history) {
      throw new Error('History item not found');
    }

    return prisma.watchHistory.update({
      where: { id: historyId },
      data: {
        progress,
        watchedAt: new Date()
      }
    });
  }

  static async deleteHistoryItem(userId: string, historyId: string) {
    const history = await prisma.watchHistory.findFirst({
      where: {
        id: historyId,
        userId
      }
    });

    if (!history) {
      throw new Error('History item not found');
    }

    return prisma.watchHistory.delete({
      where: { id: historyId }
    });
  }

  static async clearHistory(userId: string) {
    return prisma.watchHistory.deleteMany({
      where: { userId }
    });
  }
}
