-- CreateTable
CREATE TABLE "FunctionalRequirementRelation" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'related',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionalRequirementRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunctionalRequirementRelation_fromId_idx" ON "FunctionalRequirementRelation"("fromId");

-- CreateIndex
CREATE INDEX "FunctionalRequirementRelation_toId_idx" ON "FunctionalRequirementRelation"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionalRequirementRelation_fromId_toId_key" ON "FunctionalRequirementRelation"("fromId", "toId");

-- AddForeignKey
ALTER TABLE "FunctionalRequirementRelation" ADD CONSTRAINT "FunctionalRequirementRelation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "FunctionalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalRequirementRelation" ADD CONSTRAINT "FunctionalRequirementRelation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "FunctionalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
