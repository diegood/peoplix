import gql from 'graphql-tag'
import { 
  PROJECT_FRAGMENT, 
  ROLE_FRAGMENT, 
  MILESTONE_TYPE_FRAGMENT, 
  COLLABORATOR_FRAGMENT, 
  SKILL_WITH_LEVEL_FRAGMENT, 
  HIERARCHY_TYPE_FRAGMENT,
  WORK_PACKAGE_FRAGMENT
} from '@/graphql/fragments'

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      ...ProjectFields
      requiredRoles {
          id
          resourceCount
          monthlyHours
          role {
              ...RoleFields
          }
          skills {
              id
              name
              level
          }
      }
      allocations {
        id
        collaborator {
            ...CollaboratorFields
        }
        roles {
            ...RoleFields
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
          ...MilestoneTypeFields
        }
      }
      allocations {
        id
        dedicationPercentage
        hours
        startWeek
        endWeek
        roles {
            ...RoleFields
        }
        collaborator {
          ...CollaboratorFields
          skills {
            ...SkillWithLevelFields
          }
        }
        supervisors {
          id
          hierarchyType {
            ...HierarchyTypeFields
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
            ...HierarchyTypeFields
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
  ${PROJECT_FRAGMENT}
  ${ROLE_FRAGMENT}
  ${MILESTONE_TYPE_FRAGMENT}
  ${COLLABORATOR_FRAGMENT}
  ${SKILL_WITH_LEVEL_FRAGMENT}
  ${HIERARCHY_TYPE_FRAGMENT}
`

export const GET_PROJECT_WORK_PACKAGES = gql`
  query GetProjectWorkPackages($projectId: ID!) {
     projectWorkPackages(projectId: $projectId) {
       ...WorkPackageFields
     }
  }
  ${WORK_PACKAGE_FRAGMENT}
`

export const GET_PLANNING_PROJECTS = gql`
  query GetPlanningProjects {
    projects {
      id
      name
      startDate
      requiredRoles {
        id
        role {
          id
          name
        }
      }
      workPackages {
        ...WorkPackageFields
        tasks {
          id
          name
          startDate
          endDate
          estimations {
             id
             hours
             startDate
             endDate
             role {
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
      }
    }
  }
  ${WORK_PACKAGE_FRAGMENT}
`
