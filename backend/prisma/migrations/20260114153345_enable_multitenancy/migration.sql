/*
  Warnings:

  - A unique constraint covering the columns `[userId,organizationId]` on the table `Collaborator` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Collaborator_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_userId_organizationId_key" ON "Collaborator"("userId", "organizationId");
