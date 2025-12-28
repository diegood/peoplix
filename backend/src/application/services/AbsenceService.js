import { PrismaAbsenceRepository } from '../../infrastructure/repositories/PrismaAbsenceRepository.js'
import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'
import { PrismaWorkCenterRepository } from '../../infrastructure/repositories/PrismaWorkCenterRepository.js'

export class AbsenceService {
    constructor(repositories = {}) {
        this.repository = repositories.absence || new PrismaAbsenceRepository()
        this.collaboratorRepo = repositories.collaborator || new PrismaCollaboratorRepository()
        this.workCenterRepo = repositories.workCenter || new PrismaWorkCenterRepository()
    }

    async getAbsenceTypes() { return this.repository.findAllTypes() }
    async createAbsenceType(data) { return this.repository.createType(data) }
    async updateAbsenceType(id, data) { return this.repository.updateType(id, data) }
    async deleteAbsenceType(id) { return this.repository.deleteType(id) }

    async getAbsences(filters) { return this.repository.findAbsences(filters) }

    async requestAbsence({ collaboratorId, typeId, startDate, endDate, reason }) {
        const daysConsumed = await this.calculateConsumedDays(collaboratorId, startDate, endDate)
        
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

    async updateCollaboratorVacationConfig(collaboratorId, year, days) {
        const collaborator = await this.collaboratorRepo.findById(collaboratorId)
        let config = collaborator.vacationDaysPerYear || {}
        
        if (typeof config !== 'object' || config === null) config = {}
        if (typeof config !== 'object' || config === null) config = {}
        
        config[String(year)] = days
        
        return this.collaboratorRepo.update(collaboratorId, {
            vacationDaysPerYear: config
        })
    }
// TODO [REFACTOR][LOW] tengo que tratar de bajar la complejidad de este método
    async calculateConsumedDays(collaboratorId, startStr, endStr) {
        const start = new Date(startStr)
        const end = new Date(endStr)
        const collaborator = await this.collaboratorRepo.findById(collaboratorId)
        
        let holidays = []
        if (collaborator.workCenterId) {
            const wc = await this.workCenterRepo.findById(collaborator.workCenterId)
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
            const isHoliday = holidays.includes(current.toISOString().split('T')[0])
            
            if (!isWeekend && !isHoliday) {
                count++
            }
            current.setDate(current.getDate() + 1)
        }
        return count
    }
}
