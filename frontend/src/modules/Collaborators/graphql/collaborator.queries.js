import gql from 'graphql-tag'

export const GET_COLLABORATORS = gql`
  query GetCollaborators {
    collaborators {
      id
      userName
      email
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
      vacationDaysPerYear
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
      useCustomSchedule
      workingSchedule
    }
  }
`


export const GET_COLLABORATOR_CAREER_PLAN = gql`
  query GetCollaboratorCareerPlan($id: ID!) {
    collaborator(id: $id) {
      id
      firstName
      lastName
      userName
      contractedHours
      joinDate
      skills {
        id
        level
        skill { id name }
      }
      skillHistory {
        id
        level
        createdAt
        skill { id name }
      }
      careerObjectives {
        id
        year
        quarter
        description
        status
        skill { id name }
        targetLevel
      }
      projectSkills {
         id
         name
      }
      meetings {
        id
        date
        notes
        actionItems { 
            id 
            description 
            status 
        }
      }
    }
  }
`

export const SEARCH_GLOBAL_USERS = gql`
  query SearchGlobalUsers($search: String!) {
    searchGlobalUsers(search: $search) {
      id
      firstName
      lastName
      email
    }
  }
`
