import gql from 'graphql-tag'

export const CREATE_COLLABORATOR = gql`
  mutation CreateCollaborator($userName: String, $email: String, $firstName: String!, $lastName: String!, $contractedHours: Int!, $joinDate: String!, $workCenterId: ID, $useCustomSchedule: Boolean, $workingSchedule: JSON) {
    createCollaborator(userName: $userName, email: $email, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, workCenterId: $workCenterId, useCustomSchedule: $useCustomSchedule, workingSchedule: $workingSchedule) {
      id
      userName
      firstName
      lastName
      contractedHours
      joinDate
      isActive
      workCenter {
          id
          name
      }
    }
  }
`

export const UPDATE_COLLABORATOR = gql`
  mutation UpdateCollaborator($id: ID!, $userName: String, $firstName: String, $lastName: String, $contractedHours: Int, $joinDate: String, $isActive: Boolean, $workCenterId: ID, $useCustomSchedule: Boolean, $workingSchedule: JSON) {
    updateCollaborator(id: $id, userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, isActive: $isActive, workCenterId: $workCenterId, useCustomSchedule: $useCustomSchedule, workingSchedule: $workingSchedule) {
      id
      userName
      firstName
      lastName
      contractedHours
      joinDate
      isActive
      workCenter {
          id
          name
          publicHolidayCalendars {
             id
             year
             holidays {
                date
                name
             }
          }
      }
    }
  }
`

export const DELETE_COLLABORATOR = gql`
  mutation DeleteCollaborator($id: ID!) {
    deleteCollaborator(id: $id)
  }
`

export const ADD_COLLABORATOR_SKILL = gql`
  mutation AddCollaboratorSkill($collaboratorId: ID!, $skillId: ID!, $level: Int!) {
    addCollaboratorSkill(collaboratorId: $collaboratorId, skillId: $skillId, level: $level) {
      id
      skills {
        id
        level
        skill {
          id
          name
        }
      }
    }
  }
`

export const REMOVE_COLLABORATOR_SKILL = gql`
  mutation RemoveCollaboratorSkill($collaboratorId: ID!, $skillId: ID!) {
     removeCollaboratorSkill(collaboratorId: $collaboratorId, skillId: $skillId) {
       id
       skills {
         id
         level
         skill {
           id
           name
         }
       }
     }
  }
`

export const ADD_HARDWARE = gql`
  mutation AddHardware($collaboratorId: ID!, $name: String!, $type: String!, $serialNumber: String) {
    addHardware(collaboratorId: $collaboratorId, name: $name, type: $type, serialNumber: $serialNumber) {
      id
      name
      type
      serialNumber
      assignedDate
    }
  }
`

export const REMOVE_HARDWARE = gql`
  mutation RemoveHardware($id: ID!) {
    removeHardware(id: $id)
  }
`

export const UPDATE_HOLIDAY_CALENDAR = gql`
  mutation UpdateHolidayCalendar($collaboratorId: ID!, $year: Int!, $holidays: [String!]!) {
    updateHolidayCalendar(collaboratorId: $collaboratorId, year: $year, holidays: $holidays) {
      id
      year
      holidays
    }
  }
`

export const SET_CUSTOM_FIELD_VALUE = gql`
  mutation SetCustomFieldValue($collaboratorId: ID!, $fieldDefinitionId: ID!, $value: String!) {
    setCustomFieldValue(collaboratorId: $collaboratorId, fieldDefinitionId: $fieldDefinitionId, value: $value) {
      id
      customFields {
        id
        value
        fieldDefinitionId
      }
    }
  }
`

export const ADD_COLLABORATOR_CAREER_OBJECTIVE = gql`
  mutation AddCollaboratorCareerObjective($collaboratorId: ID!, $year: Int!, $quarter: Int!, $description: String!, $skillId: ID, $targetLevel: Int) {
    addCollaboratorCareerObjective(collaboratorId: $collaboratorId, year: $year, quarter: $quarter, description: $description, skillId: $skillId, targetLevel: $targetLevel) {
      id
      year
      quarter
      description
      status
      skill { id name }
      targetLevel
    }
  }
`

export const UPDATE_COLLABORATOR_CAREER_OBJECTIVE = gql`
  mutation UpdateCollaboratorCareerObjective($id: ID!, $status: String!) {
    updateCollaboratorCareerObjective(id: $id, status: $status) {
       id
       status
    }
  }
`

export const DELETE_COLLABORATOR_CAREER_OBJECTIVE = gql`
  mutation DeleteCollaboratorCareerObjective($id: ID!) {
    deleteCollaboratorCareerObjective(id: $id)
  }
`

export const ADD_COLLABORATOR_MEETING = gql`
  mutation AddCollaboratorMeeting($collaboratorId: ID!, $date: String!, $notes: String) {
    addCollaboratorMeeting(collaboratorId: $collaboratorId, date: $date, notes: $notes) {
      id
      date
      notes
      actionItems { id description status }
    }
  }
`

export const UPDATE_COLLABORATOR_MEETING = gql`
  mutation UpdateCollaboratorMeeting($id: ID!, $date: String, $notes: String) {
    updateCollaboratorMeeting(id: $id, date: $date, notes: $notes) {
      id
      date
      notes
      actionItems { id description status }
    }
  }
`

export const DELETE_COLLABORATOR_MEETING = gql`
  mutation DeleteCollaboratorMeeting($id: ID!) {
    deleteCollaboratorMeeting(id: $id)
  }
`

export const ADD_MEETING_ACTION_ITEM = gql`
  mutation AddMeetingActionItem($meetingId: ID!, $description: String!) {
    addMeetingActionItem(meetingId: $meetingId, description: $description) {
      id
      description
      status
    }
  }
`

export const UPDATE_MEETING_ACTION_ITEM = gql`
  mutation UpdateMeetingActionItem($id: ID!, $status: String, $description: String) {
    updateMeetingActionItem(id: $id, status: $status, description: $description) {
      id
      status
      description
    }
  }
`

export const DELETE_MEETING_ACTION_ITEM = gql`
  mutation DeleteMeetingActionItem($id: ID!) {
     deleteMeetingActionItem(id: $id)
  }
`
