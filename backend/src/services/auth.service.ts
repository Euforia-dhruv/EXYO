import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../server';
import { EmailService } from './email.service';
import { RegisterInput, LoginInput, JwtPayload } from '../types';

const SALT_ROUNDS = 12;

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error(existingUser.email === input.email ? 'Email already registered' : 'Username already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash
      }
    });

    const tokens = await this.generateTokens(user.id, user.email, user.username);

    try {
      await EmailService.sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      },
      ...tokens
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      },
      ...tokens
    };
  }

  static async refreshToken(token: string) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token }
    });

    if (!refreshToken || refreshToken.revoked) {
      throw new Error('Invalid refresh token');
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new Error('Refresh token expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: refreshToken.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revoked: true }
    });

    return this.generateTokens(user.id, user.email, user.username);
  }

  static async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true }
    });
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1h' }
    );

    try {
      await EmailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send reset email:', error);
    }

    return {
      message: 'If the email exists, a reset link has been sent'
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash }
      });

      await prisma.refreshToken.updateMany({
        where: { userId: decoded.userId },
        data: { revoked: true }
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  private static async generateTokens(userId: string, email: string, username: string) {
    const payload: JwtPayload = { userId, email, username };

    const accessOptions: SignOptions = { expiresIn: '1h' };
    const refreshOptions: SignOptions = { expiresIn: '7d' };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET!,
      accessOptions
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      refreshOptions
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }
}
