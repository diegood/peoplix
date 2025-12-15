import gql from 'graphql-tag'

export const GET_ABSENCE_TYPES = gql`
  query GetAbsenceTypes {
    absenceTypes {
      id
      name
      color
      isPaid
      requiresApproval
      isVacation
    }
  }
`

export const GET_ABSENCES = gql`
  query GetAbsences($collaboratorId: ID, $projectId: ID, $startDate: String, $endDate: String) {
    absences(collaboratorId: $collaboratorId, projectId: $projectId, startDate: $startDate, endDate: $endDate) {
      id
      startDate
      endDate
      status
      reason
      daysConsumed
      type {
        id
        name
        color
        isVacation
      }
      collaborator {
          id
          firstName
          lastName
      }
    }
  }
`

export const CREATE_ABSENCE_TYPE = gql`
  mutation CreateAbsenceType($name: String!, $color: String!, $isPaid: Boolean!, $requiresApproval: Boolean!, $isVacation: Boolean!) {
    createAbsenceType(name: $name, color: $color, isPaid: $isPaid, requiresApproval: $requiresApproval, isVacation: $isVacation) {
      id
      name
      color
    }
  }
`

export const UPDATE_ABSENCE_TYPE = gql`
  mutation UpdateAbsenceType($id: ID!, $name: String, $color: String, $isPaid: Boolean, $requiresApproval: Boolean, $isVacation: Boolean) {
    updateAbsenceType(id: $id, name: $name, color: $color, isPaid: $isPaid, requiresApproval: $requiresApproval, isVacation: $isVacation) {
      id
      name
      color
    }
  }
`

export const DELETE_ABSENCE_TYPE = gql`
  mutation DeleteAbsenceType($id: ID!) {
    deleteAbsenceType(id: $id)
  }
`

export const REQUEST_ABSENCE = gql`
  mutation RequestAbsence($collaboratorId: ID!, $typeId: ID!, $startDate: String!, $endDate: String!, $reason: String) {
    requestAbsence(collaboratorId: $collaboratorId, typeId: $typeId, startDate: $startDate, endDate: $endDate, reason: $reason) {
      id
      status
      daysConsumed
    }
  }
`

export const DELETE_ABSENCE = gql`
  mutation DeleteAbsence($id: ID!) {
    deleteAbsence(id: $id)
  }
`

export const UPDATE_VACATION_CONFIG = gql`
  mutation UpdateCollaboratorVacationConfig($collaboratorId: ID!, $year: Int!, $days: Int!) {
    updateCollaboratorVacationConfig(collaboratorId: $collaboratorId, year: $year, days: $days) {
      id
      vacationDaysPerYear
    }
  }
`
