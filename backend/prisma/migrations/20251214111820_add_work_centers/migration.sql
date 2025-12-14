-- AlterTable
ALTER TABLE "Collaborator" ADD COLUMN     "workCenterId" TEXT;

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHolidayCalendar" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "holidays" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,

    CONSTRAINT "PublicHolidayCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenter_name_key" ON "WorkCenter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHolidayCalendar_workCenterId_year_key" ON "PublicHolidayCalendar"("workCenterId", "year");

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicHolidayCalendar" ADD CONSTRAINT "PublicHolidayCalendar_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
