import { prisma } from '../database/client.js'

export class PrismaWorkCenterRepository {
    async findAll() {
        return prisma.workCenter.findMany({
            include: {
                publicHolidayCalendars: true
            }
        })
    }

    async create(data) {
        return prisma.workCenter.create({ data })
    }

    async update(id, data) {
        return prisma.workCenter.update({
            where: { id },
             data
        })
    }

    async delete(id) {
        await prisma.workCenter.delete({ where: { id } })
        return true
    }
    
    async findPublicHolidayCalendars(workCenterId) {
        return prisma.publicHolidayCalendar.findMany({ where: { workCenterId } })
    }
    
    async savePublicHolidayCalendar({ workCenterId, year, holidays }) {
         const holidaysJson = JSON.stringify(holidays)
         return prisma.publicHolidayCalendar.upsert({
             where: {
                 workCenterId_year: { workCenterId, year }
             },
             update: { holidays: holidaysJson },
             create: { workCenterId, year, holidays: holidaysJson }
         })
    }
}
