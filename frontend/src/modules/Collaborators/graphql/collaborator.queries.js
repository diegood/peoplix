import gql from 'graphql-tag'

export const GET_COLLABORATORS = gql`
  query GetCollaborators {
    collaborators {
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
      skills {
        id
        level
        skill {
          id
          name
        }
      }
      allocations {
        id
        project {
          id
          name
        }
      }
      hardware {
        id
        name
        type
        serialNumber
        assignedDate
      }
      holidayCalendar {
        id
        year
        holidays
        lastModified
      }
      customFields {
         id
         value
         fieldDefinitionId
      }
    }
  }
`

export const CREATE_COLLABORATOR = gql`
  mutation CreateCollaborator($userName: String, $firstName: String!, $lastName: String!, $contractedHours: Int!, $joinDate: String!, $workCenterId: ID) {
    createCollaborator(userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, workCenterId: $workCenterId) {
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
  mutation UpdateCollaborator($id: ID!, $userName: String, $firstName: String, $lastName: String, $contractedHours: Int, $joinDate: String, $isActive: Boolean, $workCenterId: ID) {
    updateCollaborator(id: $id, userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, isActive: $isActive, workCenterId: $workCenterId) {
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
