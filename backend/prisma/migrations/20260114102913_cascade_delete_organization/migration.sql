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
DO $$ BEGIN
    ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "HierarchyType" ADD CONSTRAINT "HierarchyType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "MilestoneType" ADD CONSTRAINT "MilestoneType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Skill" ADD CONSTRAINT "Skill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Technology" ADD CONSTRAINT "Technology_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "WorkCenter" ADD CONSTRAINT "WorkCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "WorkPackageStatus" ADD CONSTRAINT "WorkPackageStatus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
