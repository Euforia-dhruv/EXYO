import { prisma } from '../server';
import { DEFAULT_ADDONS } from '../config/default-addons';

export async function ensureUserExists(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { id: clerkUserId } });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: { id: clerkUserId, username: clerkUserId, email: `${clerkUserId}@clerk` }
  });

  await prisma.userAddon.createMany({
    data: DEFAULT_ADDONS.map(addon => ({
      userId: clerkUserId,
      url: addon.url,
      name: addon.name,
      isDefault: true,
      active: true,
    })),
    skipDuplicates: true,
  });

  return user;
}
