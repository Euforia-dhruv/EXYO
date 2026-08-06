import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { DEFAULT_ADDONS } from '../config/default-addons';

const router = Router();

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleUser = await googleResponse.json() as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    const googleId = googleUser.id;
    const email = googleUser.email;
    const displayName = googleUser.name || undefined;
    const avatarUrl = googleUser.picture || undefined;

    let user = await prisma.user.findUnique({ where: { id: googleId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: googleId,
          username: email.split('@')[0],
          email,
          displayName,
          avatarUrl,
        },
      });

      await prisma.userAddon.createMany({
        data: DEFAULT_ADDONS.map(addon => ({
          userId: googleId,
          url: addon.url,
          name: addon.name,
          isDefault: true,
          active: true,
        })),
        skipDuplicates: true,
      });
    } else {
      const updates: Record<string, string> = {};
      if (displayName && displayName !== user.displayName) updates.displayName = displayName;
      if (avatarUrl && avatarUrl !== user.avatarUrl) updates.avatarUrl = avatarUrl;
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: googleId }, data: updates });
      }
    }

    const jwtPayload = {
      sub: googleId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
    const signature = Buffer.from(
      require('crypto').createHmac('sha256', process.env.JWT_SECRET || 'exyo-secret-key').update(`${header}.${payload}`).digest()
    ).toString('base64url');
    const token = `${header}.${payload}.${signature}`;

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
