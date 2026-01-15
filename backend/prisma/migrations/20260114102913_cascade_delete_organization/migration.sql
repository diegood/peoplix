-- DropForeignKey
ALTER TABLE "Collaborator" DROP CONSTRAINT IF EXISTS "Collaborator_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFieldDefinition" DROP CONSTRAINT IF EXISTS "CustomFieldDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "HierarchyType" DROP CONSTRAINT IF EXISTS "HierarchyType_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "MilestoneType" DROP CONSTRAINT IF EXISTS "MilestoneType_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Technology" DROP CONSTRAINT IF EXISTS "Technology_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkCenter" DROP CONSTRAINT IF EXISTS "WorkCenter_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkPackageStatus" DROP CONSTRAINT IF EXISTS "WorkPackageStatus_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT IF NOT EXISTS "Collaborator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT IF NOT EXISTS "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyType" ADD CONSTRAINT IF NOT EXISTS "HierarchyType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneType" ADD CONSTRAINT IF NOT EXISTS "MilestoneType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT IF NOT EXISTS "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT IF NOT EXISTS "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT IF NOT EXISTS "Skill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technology" ADD CONSTRAINT IF NOT EXISTS "Technology_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenter" ADD CONSTRAINT IF NOT EXISTS "WorkCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackageStatus" ADD CONSTRAINT IF NOT EXISTS "WorkPackageStatus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
