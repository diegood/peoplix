-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_collaboratorId_fkey";

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
