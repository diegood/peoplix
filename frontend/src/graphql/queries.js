import gql from 'graphql-tag'

export const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
    }
  }
`

export const CREATE_ROLE = gql`
  mutation CreateRole($name: String!) {
    createRole(name: $name) {
      id
      name
    }
  }
`

export const DELETE_ROLE = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`

export const GET_TECHNOLOGIES = gql`
  query GetTechnologies {
    technologies {
      id
      name
    }
  }
`

export const CREATE_TECHNOLOGY = gql`
  mutation CreateTechnology($name: String!) {
    createTechnology(name: $name) {
      id
      name
    }
  }
`

export const DELETE_TECHNOLOGY = gql`
  mutation DeleteTechnology($id: ID!) {
    deleteTechnology(id: $id)
  }
`

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
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
          name
          skills {
            id
            name
            level
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
              name
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
              name
            }
          }
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
  mutation DeleteAllocation($allocationId: ID!) {
    deleteAllocation(allocationId: $allocationId)
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

export const GET_MILESTONE_TYPES = gql`
  query GetMilestoneTypes {
    milestoneTypes {
      id
      name
      color
    }
  }
`

export const CREATE_MILESTONE_TYPE = gql`
  mutation CreateMilestoneType($name: String!, $color: String!) {
    createMilestoneType(name: $name, color: $color) {
      id
      name
      color
    }
  }
`

export const UPDATE_MILESTONE_TYPE = gql`
  mutation UpdateMilestoneType($id: ID!, $name: String, $color: String) {
    updateMilestoneType(id: $id, name: $name, color: $color) {
      id
      name
      color
    }
  }
`

export const DELETE_MILESTONE_TYPE = gql`
  mutation DeleteMilestoneType($id: ID!) {
    deleteMilestoneType(id: $id)
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

export const CREATE_MILESTONE = gql`
  mutation CreateMilestone($projectId: ID!, $name: String!, $date: String!, $type: String, $milestoneTypeId: ID) {
    createMilestone(projectId: $projectId, name: $name, date: $date, type: $type, milestoneTypeId: $milestoneTypeId) {
      id
      name
      date
      milestoneType {
        id
        name
        color
      }
    }
  }
`

export const DELETE_MILESTONE = gql`
  mutation DeleteMilestone($id: ID!) {
    deleteMilestone(id: $id)
  }
`

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $contractedHours: Int!) {
    createProject(name: $name, contractedHours: $contractedHours) {
      id
      name
      contractedHours
    }
  }
`

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String!, $contractedHours: Int!) {
    updateProject(id: $id, name: $name, contractedHours: $contractedHours) {
      id
      name
      contractedHours
    }
  }
`

export const ADD_PROJECT_REQUIREMENT = gql`
  mutation AddProjectRequirement($projectId: ID!, $roleId: ID!, $resourceCount: Int, $monthlyHours: Int) {
    addProjectRequirement(projectId: $projectId, roleId: $roleId, resourceCount: $resourceCount, monthlyHours: $monthlyHours) {
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
  }
`

export const REMOVE_PROJECT_REQUIREMENT = gql`
  mutation RemoveProjectRequirement($projectId: ID!, $requirementId: ID!) {
    removeProjectRequirement(projectId: $projectId, requirementId: $requirementId)
  }
`

export const ADD_REQUIREMENT_SKILL = gql`
  mutation AddRequirementSkill($projectId: ID!, $requirementId: ID!, $skillName: String!, $level: Int!) {
    addRequirementSkill(projectId: $projectId, requirementId: $requirementId, skillName: $skillName, level: $level) {
      id
      name
      level
    }
  }
`

export const REMOVE_REQUIREMENT_SKILL = gql`
  mutation RemoveRequirementSkill($projectId: ID!, $requirementId: ID!, $skillId: ID!) {
    removeRequirementSkill(projectId: $projectId, requirementId: $requirementId, skillId: $skillId)
  }
`

export const ADD_COLLABORATOR_SKILL = gql`
  mutation AddCollaboratorSkill($collaboratorId: ID!, $skillName: String!, $level: Int!) {
    addCollaboratorSkill(collaboratorId: $collaboratorId, skillName: $skillName, level: $level) {
      id
      name
      level
    }
  }
`

export const REMOVE_COLLABORATOR_SKILL = gql`
  mutation RemoveCollaboratorSkill($collaboratorId: ID!, $skillId: ID!) {
    removeCollaboratorSkill(collaboratorId: $collaboratorId, skillId: $skillId)
  }
`

export const GET_COLLABORATORS = gql`
  query GetCollaborators {
    collaborators {
      id
      name
      contractedHours
      roles {
        id
        name
      }
      skills {
        id
        name
        level
      }
      allocations {
        id
        hours
      }
    }
  }
`

export const CREATE_COLLABORATOR = gql`
  mutation CreateCollaborator($name: String!, $contractedHours: Int!) {
    createCollaborator(name: $name, contractedHours: $contractedHours) {
      id
      name
    }
  }
`
