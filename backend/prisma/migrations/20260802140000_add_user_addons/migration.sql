-- CreateUserAddonTable
CREATE TABLE "UserAddon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "manifest" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAddon_userId_url_key" ON "UserAddon"("userId", "url");
CREATE INDEX "UserAddon_userId_idx" ON "UserAddon"("userId");

ALTER TABLE "UserAddon" ADD CONSTRAINT "UserAddon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
