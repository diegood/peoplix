import { PrismaWorkCenterRepository } from '../../infrastructure/repositories/PrismaWorkCenterRepository.js'
import { HolidayApiClient } from '../../infrastructure/external/HolidayApiClient.js'

export class WorkCenterService {
    constructor() {
        this.repository = new PrismaWorkCenterRepository()
        this.holidayApi = new HolidayApiClient()
    }
    
    async getAll() {
        return this.repository.findAll()
    }
    
    async create(data) {
        return this.repository.create(data)
    }
    
    async update(id, data) {
        return this.repository.update(id, data)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async importPublicHolidays(year, countryCode, regionCode) {
        return this.holidayApi.fetchPublicHolidays(year, countryCode, regionCode)
    }
    
    async savePublicHolidayCalendar(data) {
        return this.repository.savePublicHolidayCalendar(data)
    }
    
    async getPublicHolidayCalendars(workCenterId) {
        return this.repository.findPublicHolidayCalendars(workCenterId)
    }
}
