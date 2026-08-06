import { prisma } from '../server';
import { ensureUserExists } from './user-sync.service';

export class SearchService {
  static async getSearchHistory(userId: string) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: 20
    });
  }

  static async saveSearch(userId: string, query: string) {
    await ensureUserExists(userId);
    const existing = await prisma.searchHistory.findFirst({
      where: {
        userId,
        query
      }
    });

    if (existing) {
      return prisma.searchHistory.update({
        where: { id: existing.id },
        data: { searchedAt: new Date() }
      });
    }

    const count = await prisma.searchHistory.count({
      where: { userId }
    });

    if (count >= 20) {
      const oldest = await prisma.searchHistory.findFirst({
        where: { userId },
        orderBy: { searchedAt: 'asc' }
      });

      if (oldest) {
        await prisma.searchHistory.delete({
          where: { id: oldest.id }
        });
      }
    }

    return prisma.searchHistory.create({
      data: {
        userId,
        query
      }
    });
  }

  static async clearSearchHistory(userId: string) {
    return prisma.searchHistory.deleteMany({
      where: { userId }
    });
  }
}
