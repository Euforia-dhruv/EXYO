import { prisma } from '../server';
import { ensureUserExists } from './clerk-sync.service';
import { UpdateProfileInput } from '../types';

export class UserService {
  static async getProfile(userId: string) {
    await ensureUserExists(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    await ensureUserExists(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true
      }
    });

    return user;
  }

  static async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Account deleted successfully' };
  }
}
