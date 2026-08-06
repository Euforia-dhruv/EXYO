import { prisma } from '../server';
import { DEFAULT_ADDONS } from '../config/default-addons';

export async function ensureUserExists(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: { id: userId, username: userId, email: `${userId}@google` }
  });

  await prisma.userAddon.createMany({
    data: DEFAULT_ADDONS.map(addon => ({
      userId,
      url: addon.url,
      name: addon.name,
      isDefault: true,
      active: true,
    })),
    skipDuplicates: true,
  });

  return user;
}
