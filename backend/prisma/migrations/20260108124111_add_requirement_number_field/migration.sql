/*
  Warnings:

  - You are about to drop the column `changedBy` on the `FunctionalRequirementHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FunctionalRequirement" ADD COLUMN     "number" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FunctionalRequirementHistory" DROP COLUMN "changedBy",
ADD COLUMN     "changedById" TEXT;

-- AddForeignKey
ALTER TABLE "FunctionalRequirementHistory" ADD CONSTRAINT "FunctionalRequirementHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
