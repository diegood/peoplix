import { WorkCenterService } from '../../../application/services/WorkCenterService.js'

const service = new WorkCenterService()

export const workCenterResolver = {
  Query: {
    workCenters: () => service.getAll()
  },
  Mutation: {
    createWorkCenter: (_, args) => service.create(args),
    updateWorkCenter: (_, { id, ...data }) => service.update(id, data),
    deleteWorkCenter: (_, { id }) => service.delete(id),
    importPublicHolidays: (_, { year, countryCode, regionCode }) => service.importPublicHolidays(year, countryCode, regionCode),
    savePublicHolidayCalendar: (_, args) => service.savePublicHolidayCalendar(args)
  },
  WorkCenter: {
      publicHolidayCalendars: (parent) => service.getPublicHolidayCalendars(parent.id)
  },
  PublicHolidayCalendar: {
      holidays: (parent) => {
          try {
              return typeof parent.holidays === 'string' ? JSON.parse(parent.holidays) : parent.holidays
          } catch {
              return []
          }
      }
  }
}
