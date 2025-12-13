/*
  Warnings:

  - You are about to drop the column `type` on the `AllocationHierarchy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subordinateId,hierarchyTypeId]` on the table `AllocationHierarchy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hierarchyTypeId` to the `AllocationHierarchy` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AllocationHierarchy_subordinateId_type_key";

-- AlterTable
ALTER TABLE "AllocationHierarchy" DROP COLUMN "type",
ADD COLUMN     "hierarchyTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HierarchyType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-700 border-gray-200',
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HierarchyType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HierarchyType_name_key" ON "HierarchyType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AllocationHierarchy_subordinateId_hierarchyTypeId_key" ON "AllocationHierarchy"("subordinateId", "hierarchyTypeId");

-- AddForeignKey
ALTER TABLE "AllocationHierarchy" ADD CONSTRAINT "AllocationHierarchy_hierarchyTypeId_fkey" FOREIGN KEY ("hierarchyTypeId") REFERENCES "HierarchyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
