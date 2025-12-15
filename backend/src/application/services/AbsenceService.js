import { PrismaAbsenceRepository } from '../../infrastructure/repositories/PrismaAbsenceRepository.js'
import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'
import { PrismaWorkCenterRepository } from '../../infrastructure/repositories/PrismaWorkCenterRepository.js'

export class AbsenceService {
    constructor() {
        this.repository = new PrismaAbsenceRepository()
        this.collaboratorRepo = new PrismaCollaboratorRepository()
        this.workCenterRepo = new PrismaWorkCenterRepository()
    }

    // Types
    async getAbsenceTypes() { return this.repository.findAllTypes() }
    async createAbsenceType(data) { return this.repository.createType(data) }
    async updateAbsenceType(id, data) { return this.repository.updateType(id, data) }
    async deleteAbsenceType(id) { return this.repository.deleteType(id) }

    // Absences
    async getAbsences(filters) { return this.repository.findAbsences(filters) }

    async requestAbsence({ collaboratorId, typeId, startDate, endDate, reason }) {
        // Calculate days consumed (Business Logic)
        const daysConsumed = await this.calculateConsumedDays(collaboratorId, startDate, endDate)
        
        // Default status
        // If type requires approval -> 'PENDING', else 'APPROVED' (Simulated logic, or just PENDING always for now)
        // For now, let's default to APPROVED for simplicity unless configured otherwise
        
        return this.repository.createAbsence({
            collaboratorId,
            typeId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            daysConsumed,
            status: 'APPROVED' 
        })
    }

    async updateAbsenceStatus(id, status) {
        return this.repository.updateStatus(id, status)
    }

    async deleteAbsence(id) {
        return this.repository.deleteAbsence(id)
    }

    // Config
    async updateCollaboratorVacationConfig(collaboratorId, year, days) {
        const collaborator = await this.collaboratorRepo.findById(collaboratorId)
        let config = collaborator.vacationDaysPerYear || {}
        
        // Ensure it's an object (Prisma Json can be anything)
        if (typeof config !== 'object' || config === null) config = {}
        
        config[String(year)] = days
        
        return this.collaboratorRepo.update(collaboratorId, {
            vacationDaysPerYear: config
        })
    }

    // Helper: Calculate Days Consumed
    async calculateConsumedDays(collaboratorId, startStr, endStr) {
        const start = new Date(startStr)
        const end = new Date(endStr)
        const collaborator = await this.collaboratorRepo.findById(collaboratorId)
        
        let holidays = []
        if (collaborator.workCenterId) {
            const wc = await this.workCenterRepo.findById(collaborator.workCenterId)
            // Fetch holidays for the years involved... simpler: check all loaded calendars
            // Assuming simplified logic: fetching all holidays for current/next year
            // For now, fetching all public holidays from WC is tricky without "include".
            // Let's assume fetchById includes them or we fetch separately.
            // Actually `findById` in CollaboratorRepo includes `workCenter` but maybe not deep.
            // Let's rely on WorkCenterRepo to get holidays.
             // NOTE: Work Center Logic needs to be robust. 
             // We'll iterate dates.
            if (wc && wc.publicHolidayCalendars) {
                 holidays = wc.publicHolidayCalendars.flatMap(c => {
                     let hList = c.holidays
                     if (typeof hList === 'string') {
                         try { hList = JSON.parse(hList) } catch { hList = [] }
                     }
                     return Array.isArray(hList) ? hList.map(h => h.date) : []
                 })
             }
        }

        let count = 0
        let current = new Date(start)
        while (current <= end) {
            const dayOfWeek = current.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isHoliday = holidays.includes(current.toISOString().split('T')[0]) // Simplified check
            
            if (!isWeekend && !isHoliday) {
                count++
            }
            current.setDate(current.getDate() + 1)
        }
        return count
    }
}
