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
  CUSTOM_FIELD_VALUE_FRAGMENT
} from './fragments'

export const GET_ROLES = gql`
  query GetRoles {
    roles {
      ...RoleFields
    }
  }
  ${ROLE_FRAGMENT}
`

export const GET_SKILLS = gql`
  query GetSkills {
    skills {
      ...SkillFields
    }
  }
  ${SKILL_FRAGMENT}
`

export const GET_TECHNOLOGIES = gql`
  query GetTechnologies {
    technologies {
      id
      name
    }
  }
`

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
              name
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
              name
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

export const GET_MILESTONE_TYPES = gql`
  query GetMilestoneTypes {
    milestoneTypes {
      ...MilestoneTypeFields
    }
  }
  ${MILESTONE_TYPE_FRAGMENT}
`

export const GET_COLLABORATORS = gql`
  query GetCollaborators {
    collaborators {
      ...CollaboratorFields
      roles {
        ...RoleFields
      }
      skills {
        ...SkillWithLevelFields
      }
      allocations {
        id
        project {
          ...ProjectFields
        }
      }
      hardware {
        ...HardwareFields
      }
      holidayCalendar {
        ...HolidayCalendarFields
      }
      customFields {
        ...CustomFieldValueFields
      }
    }
  }
  ${COLLABORATOR_FRAGMENT}
  ${ROLE_FRAGMENT}
  ${SKILL_WITH_LEVEL_FRAGMENT}
  ${PROJECT_FRAGMENT}
  ${HARDWARE_FRAGMENT}
  ${HOLIDAY_CALENDAR_FRAGMENT}
  ${CUSTOM_FIELD_VALUE_FRAGMENT}
`

export const GET_CUSTOM_FIELD_DEFINITIONS = gql`
  query GetCustomFieldDefinitions {
    customFieldDefinitions {
      ...CustomFieldDefinitionFields
    }
  }
  ${CUSTOM_FIELD_DEFINITION_FRAGMENT}
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
