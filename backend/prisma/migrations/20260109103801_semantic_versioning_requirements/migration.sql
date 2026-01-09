/*
  Warnings:

  - You are about to drop the column `version` on the `FunctionalRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `FunctionalRequirementHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FunctionalRequirement" DROP COLUMN "version",
ADD COLUMN     "versionMajor" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "versionMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "versionPatch" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FunctionalRequirementHistory" DROP COLUMN "version",
ADD COLUMN     "versionMajor" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "versionMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "versionPatch" INTEGER NOT NULL DEFAULT 0;
