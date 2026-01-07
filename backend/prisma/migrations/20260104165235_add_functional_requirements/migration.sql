/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Collaborator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `HierarchyType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `MilestoneType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,tag]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `Technology` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Collaborator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Collaborator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `CustomFieldDefinition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `HierarchyType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `MilestoneType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Skill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Technology` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `WorkCenter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'VALIDATED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "CardRisk" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('BLOCKS', 'EXPECTS', 'RELATES_TO');

-- CreateEnum
CREATE TYPE "CardEventType" AS ENUM ('CREATED', 'MOVED', 'ASSIGNED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED', 'UPDATED');

-- CreateEnum
CREATE TYPE "RecurrentEventType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SPECIFIC');

-- DropIndex
DROP INDEX "Collaborator_userName_key";

-- DropIndex
DROP INDEX "HierarchyType_name_key";

-- DropIndex
DROP INDEX "MilestoneType_name_key";

-- DropIndex
DROP INDEX "Role_name_key";

-- DropIndex
DROP INDEX "Skill_name_key";

-- DropIndex
DROP INDEX "Technology_name_key";

-- AlterTable
ALTER TABLE "Collaborator" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "systemRole" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "useCustomSchedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "workingSchedule" JSONB;

-- AlterTable
ALTER TABLE "CustomFieldDefinition" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HierarchyType" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MilestoneType" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "tag" TEXT NOT NULL DEFAULT 'PRO';

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TaskEstimation" ADD COLUMN     "collaboratorId" TEXT;

-- AlterTable
ALTER TABLE "Technology" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkCenter" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkPackage" ADD COLUMN     "functionalRequirementId" TEXT;

-- CreateTable
CREATE TABLE "CollaboratorCareerObjective" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "skillId" TEXT,
    "targetLevel" INTEGER,
    "collaboratorId" TEXT NOT NULL,

    CONSTRAINT "CollaboratorCareerObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorMeeting" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "collaboratorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaboratorMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorSkillHistory" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collaboratorId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CollaboratorSkillHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalRequirement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "generalDescription" TEXT,
    "actors" TEXT,
    "preconditions" TEXT,
    "expectedInputs" TEXT,
    "detailedFlow" TEXT,
    "validations" TEXT,
    "expectedOutputs" TEXT,
    "systemMessages" TEXT,
    "mockupUrl" TEXT,
    "notes" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "analystId" TEXT,

    CONSTRAINT "FunctionalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalRequirementHistory" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "diff" TEXT NOT NULL,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionalRequirementHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanbanCard" (
    "id" TEXT NOT NULL,
    "readableId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "risk" "CardRisk" NOT NULL DEFAULT 'NONE',
    "estimatedStartDate" TIMESTAMP(3),
    "estimatedEndDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "taskEstimationId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "parentCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanbanCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardCommentReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "authorId" TEXT,
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardCommentHistory" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardCommentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardEvent" (
    "id" TEXT NOT NULL,
    "type" "CardEventType" NOT NULL,
    "details" TEXT,
    "cardId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardRelation" (
    "id" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "meetingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'ORG',
    "workingSchedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPackageRecurrentEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RecurrentEventType" NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "workPackageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPackageRecurrentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPackageHistory" (
    "id" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkPackageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPackageStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#cccccc',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPackageStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CardAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CardAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CardRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CardRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "KanbanCard_taskEstimationId_key" ON "KanbanCard"("taskEstimationId");

-- CreateIndex
CREATE UNIQUE INDEX "CardCommentReaction_commentId_userId_emoji_key" ON "CardCommentReaction"("commentId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_tag_key" ON "Organization"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkPackageStatus_organizationId_name_key" ON "WorkPackageStatus"("organizationId", "name");

-- CreateIndex
CREATE INDEX "_CardAssignees_B_index" ON "_CardAssignees"("B");

-- CreateIndex
CREATE INDEX "_CardRoles_B_index" ON "_CardRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_userId_key" ON "Collaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HierarchyType_name_organizationId_key" ON "HierarchyType"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneType_name_organizationId_key" ON "MilestoneType"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_tag_key" ON "Project"("organizationId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_organizationId_key" ON "Role"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_organizationId_key" ON "Skill"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_organizationId_key" ON "Technology"("name", "organizationId");

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorCareerObjective" ADD CONSTRAINT "CollaboratorCareerObjective_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorCareerObjective" ADD CONSTRAINT "CollaboratorCareerObjective_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorMeeting" ADD CONSTRAINT "CollaboratorMeeting_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorSkillHistory" ADD CONSTRAINT "CollaboratorSkillHistory_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorSkillHistory" ADD CONSTRAINT "CollaboratorSkillHistory_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalRequirement" ADD CONSTRAINT "FunctionalRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalRequirement" ADD CONSTRAINT "FunctionalRequirement_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalRequirementHistory" ADD CONSTRAINT "FunctionalRequirementHistory_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyType" ADD CONSTRAINT "HierarchyType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_taskEstimationId_fkey" FOREIGN KEY ("taskEstimationId") REFERENCES "TaskEstimation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_parentCardId_fkey" FOREIGN KEY ("parentCardId") REFERENCES "KanbanCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCommentReaction" ADD CONSTRAINT "CardCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CardComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCommentReaction" ADD CONSTRAINT "CardCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardComment" ADD CONSTRAINT "CardComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardComment" ADD CONSTRAINT "CardComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCommentHistory" ADD CONSTRAINT "CardCommentHistory_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CardComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCommentHistory" ADD CONSTRAINT "CardCommentHistory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardEvent" ADD CONSTRAINT "CardEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardEvent" ADD CONSTRAINT "CardEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardRelation" ADD CONSTRAINT "CardRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardRelation" ADD CONSTRAINT "CardRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CollaboratorMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneType" ADD CONSTRAINT "MilestoneType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEstimation" ADD CONSTRAINT "TaskEstimation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technology" ADD CONSTRAINT "Technology_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenter" ADD CONSTRAINT "WorkCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackage" ADD CONSTRAINT "WorkPackage_functionalRequirementId_fkey" FOREIGN KEY ("functionalRequirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackageRecurrentEvent" ADD CONSTRAINT "WorkPackageRecurrentEvent_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "WorkPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackageHistory" ADD CONSTRAINT "WorkPackageHistory_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "WorkPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackageStatus" ADD CONSTRAINT "WorkPackageStatus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardAssignees" ADD CONSTRAINT "_CardAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardAssignees" ADD CONSTRAINT "_CardAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardRoles" ADD CONSTRAINT "_CardRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "KanbanCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardRoles" ADD CONSTRAINT "_CardRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
