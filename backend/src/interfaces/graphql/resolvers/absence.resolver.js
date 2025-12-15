import { AbsenceService } from '../../../application/services/AbsenceService.js'

const service = new AbsenceService()

export const absenceResolver = {
  Query: {
    absenceTypes: () => service.getAbsenceTypes(),
    absences: (_, args) => service.getAbsences(args)
  },
  Mutation: {
    createAbsenceType: (_, args) => service.createAbsenceType(args),
    updateAbsenceType: (_, { id, ...data }) => service.updateAbsenceType(id, data),
    deleteAbsenceType: (_, { id }) => service.deleteAbsenceType(id),

    requestAbsence: (_, args) => service.requestAbsence(args),
    updateAbsenceStatus: (_, { id, status }) => service.updateAbsenceStatus(id, status),
    deleteAbsence: (_, { id }) => service.deleteAbsence(id),
    
    updateCollaboratorVacationConfig: (_, { collaboratorId, year, days }) => service.updateCollaboratorVacationConfig(collaboratorId, year, days)
  },
  Absence: {
      daysConsumed: (parent) => parent.daysConsumed || 0,
      startDate: (parent) => new Date(parent.startDate).toISOString(),
      endDate: (parent) => new Date(parent.endDate).toISOString()
  }
}
