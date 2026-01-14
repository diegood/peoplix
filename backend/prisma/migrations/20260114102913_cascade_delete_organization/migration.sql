-- DropForeignKey
ALTER TABLE "Collaborator" DROP CONSTRAINT "Collaborator_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFieldDefinition" DROP CONSTRAINT "CustomFieldDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "HierarchyType" DROP CONSTRAINT "HierarchyType_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "MilestoneType" DROP CONSTRAINT "MilestoneType_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Technology" DROP CONSTRAINT "Technology_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkCenter" DROP CONSTRAINT "WorkCenter_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkPackageStatus" DROP CONSTRAINT "WorkPackageStatus_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyType" ADD CONSTRAINT "HierarchyType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneType" ADD CONSTRAINT "MilestoneType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technology" ADD CONSTRAINT "Technology_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenter" ADD CONSTRAINT "WorkCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackageStatus" ADD CONSTRAINT "WorkPackageStatus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
