import { prisma } from '../server';

export async function ensureUserExists(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { id: clerkUserId } });
  if (existing) return existing;

  return prisma.user.create({
    data: { id: clerkUserId, username: clerkUserId, email: `${clerkUserId}@clerk` }
  });
}
