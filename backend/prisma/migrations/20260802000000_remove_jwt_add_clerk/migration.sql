-- Remove RefreshToken table
DROP TABLE IF EXISTS "RefreshToken" CASCADE;

-- Remove passwordHash column from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

-- Make User.id not have default (Clerk provides the ID)
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
