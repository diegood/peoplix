-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "functionalRequirementId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_functionalRequirementId_fkey" FOREIGN KEY ("functionalRequirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
