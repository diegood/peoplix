-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "isAdministrative" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CollaboratorHierarchy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "subordinateId" TEXT NOT NULL,
    "hierarchyTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaboratorHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorHierarchy_supervisorId_subordinateId_hierarchyT_key" ON "CollaboratorHierarchy"("supervisorId", "subordinateId", "hierarchyTypeId");

-- AddForeignKey
ALTER TABLE "CollaboratorHierarchy" ADD CONSTRAINT "CollaboratorHierarchy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorHierarchy" ADD CONSTRAINT "CollaboratorHierarchy_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorHierarchy" ADD CONSTRAINT "CollaboratorHierarchy_subordinateId_fkey" FOREIGN KEY ("subordinateId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorHierarchy" ADD CONSTRAINT "CollaboratorHierarchy_hierarchyTypeId_fkey" FOREIGN KEY ("hierarchyTypeId") REFERENCES "HierarchyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
