import gql from 'graphql-tag'

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      organization {
        id
      }
      name
      contractedHours
      requiredRoles {
          id
          resourceCount
          monthlyHours
          role {
              id
              name
          }
          skills {
              id
              name
              level
          }
      }
      sprints {
        id
        name
        startDate
        endDate
      }
      milestones {
        id
        name
        date
        type
        milestoneType {
          id
          name
          color
        }
      }
      allocations {
        id
        dedicationPercentage
        hours
        startWeek
        endWeek
        roles {
            id
            name
        }
        collaborator {
          id

          firstName
          lastName
          contractedHours
          skills {
            id
            level
            skill {
                id
                name
            }
          }
          workingSchedule
          useCustomSchedule
          organization {
              workingSchedule
          }
        }
        supervisors {
          id
          hierarchyType {
            id
            name
            color
          }
          supervisor {
            id
            collaborator {
              id

            }
          }
        }
        subordinates {
          id
          hierarchyType {
            id
            name
            color
          }
          subordinate {
            id
            collaborator {
              id

            }
          }
        }
      }
    }
  }
`

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
      roles {
        id
        name
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
      dedicationPercentage
      startWeek
      endWeek
      project {
        id
        name
      }
    }
    roles {
      id
      name
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
      fieldDefinition {
        id
        fieldName
        fieldLabel
        fieldType
        fieldConfig
        isRequired
      }
    }
    }
  }
`

export const CREATE_ALLOCATION = gql`
  mutation CreateAllocation($projectId: ID!, $collaboratorId: ID!, $roleId: ID!, $percentage: Int!, $startWeek: String!) {
    createAllocation(projectId: $projectId, collaboratorId: $collaboratorId, roleId: $roleId, percentage: $percentage, startWeek: $startWeek) {
      id
      dedicationPercentage
      startWeek
      roles {
        id
        name
      }
      collaborator {
        id
        firstName
        lastName
      }
    }
  }
`

export const UPDATE_ALLOCATION = gql`
  mutation UpdateAllocation($allocationId: ID!, $percentage: Int, $endWeek: String) {
    updateAllocation(allocationId: $allocationId, percentage: $percentage, endWeek: $endWeek) {
      id
      dedicationPercentage
      endWeek
    }
  }
`

export const DELETE_ALLOCATION = gql`
  mutation DeleteAllocation($id: ID!) {
    deleteAllocation(id: $id)
  }
`

export const ADD_ALLOCATION_ROLE = gql`
  mutation AddAllocationRole($allocationId: ID!, $roleId: ID!) {
    addAllocationRole(allocationId: $allocationId, roleId: $roleId) {
      id
      name
    }
  }
`

export const REMOVE_ALLOCATION_ROLE = gql`
  mutation RemoveAllocationRole($allocationId: ID!, $roleId: ID!) {
    removeAllocationRole(allocationId: $allocationId, roleId: $roleId)
  }
`

export const ADD_ALLOCATION_HIERARCHY = gql`
  mutation AddAllocationHierarchy($subordinateAllocId: ID!, $supervisorAllocId: ID!, $typeId: ID!) {
    addAllocationHierarchy(subordinateAllocId: $subordinateAllocId, supervisorAllocId: $supervisorAllocId, typeId: $typeId) {
      id
      hierarchyType {
        id
        name
        color
      }
    }
  }
`

export const REMOVE_ALLOCATION_HIERARCHY = gql`
  mutation RemoveAllocationHierarchy($hierarchyId: ID!) {
    removeAllocationHierarchy(hierarchyId: $hierarchyId)
  }
`
