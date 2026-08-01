-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "season" INTEGER,
    "episode" INTEGER,
    "progress" DOUBLE PRECISION NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addonSource" TEXT,

    CONSTRAINT "WatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WatchHistory_userId_idx" ON "WatchHistory"("userId");

-- CreateIndex
CREATE INDEX "WatchHistory_watchedAt_idx" ON "WatchHistory"("watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WatchHistory_userId_contentId_season_episode_key" ON "WatchHistory"("userId", "contentId", "season", "episode");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_contentId_key" ON "Watchlist"("userId", "contentId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_searchedAt_idx" ON "SearchHistory"("searchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
