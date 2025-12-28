import gql from 'graphql-tag'
import { 
  ROLE_FRAGMENT, 
  SKILL_FRAGMENT, 
  SKILL_WITH_LEVEL_FRAGMENT, 
  COLLABORATOR_FRAGMENT, 
  PROJECT_FRAGMENT, 
  MILESTONE_TYPE_FRAGMENT, 
  HIERARCHY_TYPE_FRAGMENT,
  HARDWARE_FRAGMENT,
  HOLIDAY_CALENDAR_FRAGMENT,
  CUSTOM_FIELD_DEFINITION_FRAGMENT,
  CUSTOM_FIELD_VALUE_FRAGMENT,
  WORK_PACKAGE_FRAGMENT,
  TASK_FRAGMENT
} from './fragments'

export const CREATE_ROLE = gql`
  mutation CreateRole($name: String!) {
    createRole(name: $name) {
      ...RoleFields
    }
  }
  ${ROLE_FRAGMENT}
`

export const DELETE_ROLE = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`

export const CREATE_SKILL = gql`
  mutation CreateSkill($name: String!) {
    createSkill(name: $name) {
      ...SkillFields
    }
  }
  ${SKILL_FRAGMENT}
`

export const DELETE_SKILL = gql`
  mutation DeleteSkill($id: ID!) {
    deleteSkill(id: $id)
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

export const CREATE_ALLOCATION = gql`
  mutation CreateAllocation($projectId: ID!, $collaboratorId: ID!, $roleId: ID!, $percentage: Int!, $startWeek: String!) {
    createAllocation(projectId: $projectId, collaboratorId: $collaboratorId, roleId: $roleId, percentage: $percentage, startWeek: $startWeek) {
      id
      dedicationPercentage
      startWeek
      roles {
        ...RoleFields
      }
    }
  }
  ${ROLE_FRAGMENT}
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
      ...RoleFields
    }
  }
  ${ROLE_FRAGMENT}
`

export const REMOVE_ALLOCATION_ROLE = gql`
  mutation RemoveAllocationRole($allocationId: ID!, $roleId: ID!) {
    removeAllocationRole(allocationId: $allocationId, roleId: $roleId)
  }
`

export const CREATE_MILESTONE_TYPE = gql`
  mutation CreateMilestoneType($name: String!, $color: String!) {
    createMilestoneType(name: $name, color: $color) {
      ...MilestoneTypeFields
    }
  }
  ${MILESTONE_TYPE_FRAGMENT}
`

export const UPDATE_MILESTONE_TYPE = gql`
  mutation UpdateMilestoneType($id: ID!, $name: String, $color: String) {
    updateMilestoneType(id: $id, name: $name, color: $color) {
      ...MilestoneTypeFields
    }
  }
  ${MILESTONE_TYPE_FRAGMENT}
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
        ...HierarchyTypeFields
      }
    }
  }
  ${HIERARCHY_TYPE_FRAGMENT}
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
        ...MilestoneTypeFields
      }
    }
  }
  ${MILESTONE_TYPE_FRAGMENT}
`

export const DELETE_MILESTONE = gql`
  mutation DeleteMilestone($id: ID!) {
    deleteMilestone(id: $id)
  }
`

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $contractedHours: Int!) {
    createProject(name: $name, contractedHours: $contractedHours) {
      ...ProjectFields
    }
  }
  ${PROJECT_FRAGMENT}
`

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String!, $contractedHours: Int!, $startDate: String) {
    updateProject(id: $id, name: $name, contractedHours: $contractedHours, startDate: $startDate) {
      ...ProjectFields
    }
  }
  ${PROJECT_FRAGMENT}
`

export const ADD_PROJECT_REQUIREMENT = gql`
  mutation AddProjectRequirement($projectId: ID!, $roleId: ID!, $resourceCount: Int, $monthlyHours: Int) {
    addProjectRequirement(projectId: $projectId, roleId: $roleId, resourceCount: $resourceCount, monthlyHours: $monthlyHours) {
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
        skill {
          ...SkillFields
        }
      }
    }
  }
  ${ROLE_FRAGMENT}
  ${SKILL_FRAGMENT}
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
        ...SkillWithLevelFields
      }
    }
  }
  ${SKILL_WITH_LEVEL_FRAGMENT}
`

export const REMOVE_COLLABORATOR_SKILL = gql`
  mutation RemoveCollaboratorSkill($collaboratorId: ID!, $skillId: ID!) {
    removeCollaboratorSkill(collaboratorId: $collaboratorId, skillId: $skillId)
  }
`

export const CREATE_COLLABORATOR = gql`
  mutation CreateCollaborator($userName: String, $firstName: String!, $lastName: String!, $contractedHours: Int!, $joinDate: String!, $password: String, $systemRole: Int) {
    createCollaborator(userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, password: $password, systemRole: $systemRole) {
      ...CollaboratorFields
    }
  }
  ${COLLABORATOR_FRAGMENT}
`

export const UPDATE_COLLABORATOR = gql`
  mutation UpdateCollaborator($id: ID!, $userName: String, $firstName: String, $lastName: String, $contractedHours: Int, $joinDate: String, $isActive: Boolean, $password: String, $systemRole: Int) {
    updateCollaborator(id: $id, userName: $userName, firstName: $firstName, lastName: $lastName, contractedHours: $contractedHours, joinDate: $joinDate, isActive: $isActive, password: $password, systemRole: $systemRole) {
      ...CollaboratorFields
      skills {
        ...SkillWithLevelFields
      }
    }
  }
  ${COLLABORATOR_FRAGMENT}
  ${SKILL_WITH_LEVEL_FRAGMENT}
`

export const DELETE_COLLABORATOR = gql`
  mutation DeleteCollaborator($id: ID!) {
     deleteCollaborator(id: $id)
  }
`

export const ADD_HARDWARE = gql`
  mutation AddHardware($collaboratorId: ID!, $name: String!, $type: String!, $serialNumber: String) {
    addHardware(collaboratorId: $collaboratorId, name: $name, type: $type, serialNumber: $serialNumber) {
      ...HardwareFields
    }
  }
  ${HARDWARE_FRAGMENT}
`

export const REMOVE_HARDWARE = gql`
  mutation RemoveHardware($id: ID!) {
    removeHardware(id: $id)
  }
`

export const UPDATE_HOLIDAY_CALENDAR = gql`
  mutation UpdateHolidayCalendar($collaboratorId: ID!, $year: Int!, $holidays: [String!]!) {
    updateHolidayCalendar(collaboratorId: $collaboratorId, year: $year, holidays: $holidays) {
      ...HolidayCalendarFields
    }
  }
  ${HOLIDAY_CALENDAR_FRAGMENT}
`

export const CREATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation CreateCustomFieldDefinition($fieldName: String!, $fieldLabel: String!, $fieldType: String!, $fieldConfig: String, $isRequired: Boolean, $order: Int) {
    createCustomFieldDefinition(fieldName: $fieldName, fieldLabel: $fieldLabel, fieldType: $fieldType, fieldConfig: $fieldConfig, isRequired: $isRequired, order: $order) {
      ...CustomFieldDefinitionFields
    }
  }
  ${CUSTOM_FIELD_DEFINITION_FRAGMENT}
`

export const UPDATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation UpdateCustomFieldDefinition($id: ID!, $fieldName: String, $fieldLabel: String, $fieldType: String, $fieldConfig: String, $isRequired: Boolean, $order: Int) {
    updateCustomFieldDefinition(id: $id, fieldName: $fieldName, fieldLabel: $fieldLabel, fieldType: $fieldType, fieldConfig: $fieldConfig, isRequired: $isRequired, order: $order) {
      ...CustomFieldDefinitionFields
    }
  }
  ${CUSTOM_FIELD_DEFINITION_FRAGMENT}
`

export const DELETE_CUSTOM_FIELD_DEFINITION = gql`
  mutation DeleteCustomFieldDefinition($id: ID!) {
    deleteCustomFieldDefinition(id: $id)
  }
`

export const SET_CUSTOM_FIELD_VALUE = gql`
  mutation SetCustomFieldValue($collaboratorId: ID!, $fieldDefinitionId: ID!, $value: String!) {
    setCustomFieldValue(collaboratorId: $collaboratorId, fieldDefinitionId: $fieldDefinitionId, value: $value) {
      ...CustomFieldValueFields
    }
  }
  ${CUSTOM_FIELD_VALUE_FRAGMENT}
`

export const CREATE_WORK_PACKAGE = gql`
  mutation CreateWorkPackage($projectId: ID!, $name: String!, $description: String, $highLevelEstimation: Int, $startDate: String) {
    createWorkPackage(projectId: $projectId, name: $name, description: $description, highLevelEstimation: $highLevelEstimation, startDate: $startDate) {
      ...WorkPackageFields
    }
  }
  ${WORK_PACKAGE_FRAGMENT}
`

export const UPDATE_WORK_PACKAGE = gql`
  mutation UpdateWorkPackage($id: ID!, $name: String, $description: String, $highLevelEstimation: Int, $startDate: String, $status: String) {
    updateWorkPackage(id: $id, name: $name, description: $description, highLevelEstimation: $highLevelEstimation, startDate: $startDate, status: $status) {
      ...WorkPackageFields
    }
  }
  ${WORK_PACKAGE_FRAGMENT}
`

export const DELETE_WORK_PACKAGE = gql`
  mutation DeleteWorkPackage($id: ID!) {
    deleteWorkPackage(id: $id)
  }
`

export const CREATE_TASK = gql`
  mutation CreateTask($workPackageId: ID, $name: String!, $description: String, $startDate: String, $collaboratorId: ID) {
    createTask(workPackageId: $workPackageId, name: $name, description: $description, startDate: $startDate, collaboratorId: $collaboratorId) {
       ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`

export const ESTIMATE_TASK = gql`
  mutation EstimateTask($taskId: ID!, $roleId: ID!, $hours: Float!, $startDate: String, $endDate: String, $collaboratorId: ID) {
    estimateTask(taskId: $taskId, roleId: $roleId, hours: $hours, startDate: $startDate, endDate: $endDate, collaboratorId: $collaboratorId) {
       ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`

export const ADD_TASK_DEPENDENCY = gql`
  mutation AddTaskDependency($taskId: ID!, $predecessorId: ID!) {
     addTaskDependency(taskId: $taskId, predecessorId: $predecessorId) {
       ...TaskFields
     }
  }
  ${TASK_FRAGMENT}
`

export const REMOVE_TASK_DEPENDENCY = gql`
  mutation RemoveTaskDependency($taskId: ID!, $predecessorId: ID!) {
     removeTaskDependency(taskId: $taskId, predecessorId: $predecessorId) {
        ...TaskFields
     }
  }
  ${TASK_FRAGMENT}
`

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $name: String, $description: String, $startDate: String, $collaboratorId: ID, $endDate: String) {
    updateTask(id: $id, name: $name, description: $description, startDate: $startDate, collaboratorId: $collaboratorId, endDate: $endDate) {
       ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`
