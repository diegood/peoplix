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
export const GET_SKILLS = gql`
  query GetSkills {
    skills {
      id
      name
    }
  }
`

export const CREATE_SKILL = gql`
  mutation CreateSkill($name: String!) {
    createSkill(name: $name) {
      id
      name
    }
  }
`

export const DELETE_SKILL = gql`
  mutation DeleteSkill($id: ID!) {
    deleteSkill(id: $id)
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
            level
            skill {
                id
                name
            }
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
    removeCollaboratorSkill(collaboratorId: $collaboratorId, skillId: $skillId)
  }
`

export const GET_COLLABORATORS = gql`
  query GetCollaborators {
    collaborators {
      id
      userName
      firstName
      lastName
      name
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

export const CREATE_COLLABORATOR = gql`
  mutation CreateCollaborator($userName: String, $firstName: String!, $lastName: String!, $contractedHours: Int!, $joinDate: String) {
    createCollaborator(userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate) {
      id
      userName
      firstName
      lastName
      joinDate
      isActive
    }
  }
`

export const UPDATE_COLLABORATOR = gql`
  mutation UpdateCollaborator($id: ID!, $userName: String, $firstName: String, $lastName: String, $contractedHours: Int, $joinDate: String, $isActive: Boolean) {
    updateCollaborator(id: $id, userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, isActive: $isActive) {
      id
      userName
      firstName
      lastName
      contractedHours
      joinDate
      isActive
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

export const DELETE_COLLABORATOR = gql`
  mutation DeleteCollaborator($id: ID!) {
     deleteCollaborator(id: $id)
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
      lastModified
    }
  }
`

export const GET_CUSTOM_FIELD_DEFINITIONS = gql`
  query GetCustomFieldDefinitions {
    customFieldDefinitions {
      id
      fieldName
      fieldLabel
      fieldType
      fieldConfig
      isRequired
      order
    }
  }
`

export const CREATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation CreateCustomFieldDefinition($fieldName: String!, $fieldLabel: String!, $fieldType: String!, $fieldConfig: String, $isRequired: Boolean, $order: Int) {
    createCustomFieldDefinition(fieldName: $fieldName, fieldLabel: $fieldLabel, fieldType: $fieldType, fieldConfig: $fieldConfig, isRequired: $isRequired, order: $order) {
      id
      fieldName
      fieldLabel
      fieldType
      fieldConfig
      isRequired
      order
    }
  }
`

export const UPDATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation UpdateCustomFieldDefinition($id: ID!, $fieldName: String, $fieldLabel: String, $fieldType: String, $fieldConfig: String, $isRequired: Boolean, $order: Int) {
    updateCustomFieldDefinition(id: $id, fieldName: $fieldName, fieldLabel: $fieldLabel, fieldType: $fieldType, fieldConfig: $fieldConfig, isRequired: $isRequired, order: $order) {
      id
      fieldName
      fieldLabel
      fieldType
      fieldConfig
      isRequired
      order
    }
  }
`

export const DELETE_CUSTOM_FIELD_DEFINITION = gql`
  mutation DeleteCustomFieldDefinition($id: ID!) {
    deleteCustomFieldDefinition(id: $id)
  }
`

export const SET_CUSTOM_FIELD_VALUE = gql`
  mutation SetCustomFieldValue($collaboratorId: ID!, $fieldDefinitionId: ID!, $value: String!) {
    setCustomFieldValue(collaboratorId: $collaboratorId, fieldDefinitionId: $fieldDefinitionId, value: $value) {
      id
      value
      fieldDefinition {
        id
        fieldName
        fieldLabel
      }
    }
  }
`
