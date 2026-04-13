-- AlterTable
ALTER TABLE "Block"
ADD COLUMN "parentId" TEXT,
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Block_pageId_isDeleted_order_idx" ON "Block"("pageId", "isDeleted", "order");

-- CreateIndex
CREATE INDEX "Block_parentId_idx" ON "Block"("parentId");

-- AddForeignKey
ALTER TABLE "Block"
ADD CONSTRAINT "Block_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
