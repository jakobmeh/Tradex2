-- CreateTable
CREATE TABLE "DatabaseProperty" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DatabaseProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseEntry" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyValue" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PropertyValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseView" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatabaseProperty_databaseId_order_idx" ON "DatabaseProperty"("databaseId", "order");

-- CreateIndex
CREATE INDEX "DatabaseEntry_databaseId_isDeleted_order_idx" ON "DatabaseEntry"("databaseId", "isDeleted", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyValue_entryId_propertyId_key" ON "PropertyValue"("entryId", "propertyId");

-- CreateIndex
CREATE INDEX "PropertyValue_propertyId_idx" ON "PropertyValue"("propertyId");

-- CreateIndex
CREATE INDEX "DatabaseView_databaseId_idx" ON "DatabaseView"("databaseId");

-- AddForeignKey
ALTER TABLE "DatabaseProperty" ADD CONSTRAINT "DatabaseProperty_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseEntry" ADD CONSTRAINT "DatabaseEntry_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyValue" ADD CONSTRAINT "PropertyValue_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DatabaseEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyValue" ADD CONSTRAINT "PropertyValue_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "DatabaseProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseView" ADD CONSTRAINT "DatabaseView_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;
