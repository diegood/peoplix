import { WorkCenterService } from '../../../application/services/WorkCenterService.js'

const service = new WorkCenterService()

export const workCenterResolver = {
  Query: {
    workCenters: () => service.getAll()
  },
  Mutation: {
    createWorkCenter: (_, args, context) => {
        if (!context.user || !context.user.organizationId) throw new Error('Unauthorized: No Organization Context');
        return service.create({ ...args, organizationId: context.user.organizationId });
    },
    updateWorkCenter: (_, { id, ...data }) => service.update(id, data),
    deleteWorkCenter: (_, { id }) => service.delete(id),
    importPublicHolidays: (_, { year, countryCode, regionCode }) => service.importPublicHolidays(year, countryCode, regionCode),
    savePublicHolidayCalendar: (_, args) => service.savePublicHolidayCalendar(args)
  },
  WorkCenter: {
      publicHolidayCalendars: (parent) => {
          if (parent.publicHolidayCalendars) return parent.publicHolidayCalendars
          return service.getPublicHolidayCalendars(parent.id)
      }
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
