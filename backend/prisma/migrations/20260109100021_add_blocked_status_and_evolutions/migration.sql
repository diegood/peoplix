-- AlterEnum
ALTER TYPE "RequirementStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "FunctionalRequirement" ADD COLUMN     "originalRequirementId" TEXT;

-- AddForeignKey
ALTER TABLE "FunctionalRequirement" ADD CONSTRAINT "FunctionalRequirement_originalRequirementId_fkey" FOREIGN KEY ("originalRequirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
