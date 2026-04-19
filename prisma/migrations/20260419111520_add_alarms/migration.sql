-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "days" TEXT NOT NULL DEFAULT 'daily',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alarm_userId_idx" ON "Alarm"("userId");

-- CreateIndex
CREATE INDEX "Alarm_isActive_idx" ON "Alarm"("isActive");

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
