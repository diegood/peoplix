-- CreateTable
CREATE TABLE "AllocationHierarchy" (
    "id" TEXT NOT NULL,
    "subordinateId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "AllocationHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllocationHierarchy_subordinateId_type_key" ON "AllocationHierarchy"("subordinateId", "type");

-- AddForeignKey
ALTER TABLE "AllocationHierarchy" ADD CONSTRAINT "AllocationHierarchy_subordinateId_fkey" FOREIGN KEY ("subordinateId") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationHierarchy" ADD CONSTRAINT "AllocationHierarchy_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
