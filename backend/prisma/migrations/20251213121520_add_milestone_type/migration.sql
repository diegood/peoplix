-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "milestoneTypeId" TEXT;

-- CreateTable
CREATE TABLE "MilestoneType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-gray-400',

    CONSTRAINT "MilestoneType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneType_name_key" ON "MilestoneType"("name");

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_milestoneTypeId_fkey" FOREIGN KEY ("milestoneTypeId") REFERENCES "MilestoneType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
