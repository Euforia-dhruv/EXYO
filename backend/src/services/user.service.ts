import bcrypt from 'bcrypt';
import { prisma } from '../server';
import { UpdateProfileInput, ChangePasswordInput } from '../types';

const SALT_ROUNDS = 12;

export class UserService {
  static async getProfile(userId: string) {
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
    if (input.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: input.email,
          NOT: { id: userId }
        }
      });

      if (existingEmail) {
        throw new Error('Email already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        email: input.email,
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

  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!validPassword) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });

    return { message: 'Password updated successfully' };
  }

  static async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Account deleted successfully' };
  }
}
