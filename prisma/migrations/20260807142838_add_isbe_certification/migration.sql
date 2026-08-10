-- AlterTable
ALTER TABLE "State" ALTER COLUMN "evidenceID" DROP NOT NULL;

-- CreateTable
CREATE TABLE "IsbeCertification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT,
    "stateId" TEXT,
    "hash" TEXT NOT NULL,
    "executionId" INTEGER NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IsbeCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IsbeCertification_organizationId_idx" ON "IsbeCertification"("organizationId");

-- CreateIndex
CREATE INDEX "IsbeCertification_itemId_idx" ON "IsbeCertification"("itemId");

-- CreateIndex
CREATE INDEX "IsbeCertification_stateId_idx" ON "IsbeCertification"("stateId");

-- CreateIndex
CREATE INDEX "IsbeCertification_hash_idx" ON "IsbeCertification"("hash");

-- AddForeignKey
ALTER TABLE "IsbeCertification" ADD CONSTRAINT "IsbeCertification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsbeCertification" ADD CONSTRAINT "IsbeCertification_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsbeCertification" ADD CONSTRAINT "IsbeCertification_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;
