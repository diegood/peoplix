-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RasciRole" AS ENUM ('RESPONSIBLE', 'ACCOUNTABLE', 'SUPPORT', 'CONSULTED', 'INFORMED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Responsibility" (
    "id" TEXT NOT NULL,
    "role" "RasciRole" NOT NULL,
    "allocationId" TEXT NOT NULL,
    "workPackageId" TEXT,
    "functionalRequirementId" TEXT,
    "targetAllocationId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "WorkPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_functionalRequirementId_fkey" FOREIGN KEY ("functionalRequirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_targetAllocationId_fkey" FOREIGN KEY ("targetAllocationId") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
