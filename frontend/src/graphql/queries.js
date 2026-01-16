import gql from 'graphql-tag'
import { 
  ROLE_FRAGMENT, 
  SKILL_FRAGMENT, 
  SKILL_WITH_LEVEL_FRAGMENT, 
  COLLABORATOR_FRAGMENT, 
  PROJECT_FRAGMENT, 
  HARDWARE_FRAGMENT,
  HOLIDAY_CALENDAR_FRAGMENT,
  CUSTOM_FIELD_DEFINITION_FRAGMENT,
  CUSTOM_FIELD_VALUE_FRAGMENT,
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

export const GET_COLLABORATORS = gql`
  query GetCollaborators($search: String) {
    collaborators(search: $search) {
      ...CollaboratorFields
      roles {
        ...RoleFields
      }
      skills {
        ...SkillWithLevelFields
      }
      allocations {
        id
        dedicationPercentage
        startWeek
        endWeek
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
  mutation CreateCustomFieldDefinition($fieldName: String!, $fieldLabel: String!, $fieldType: String!, $fieldConfig: String, $isRequired: Boolean!, $order: Int!) {
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
export const GET_WORK_CENTERS = gql`
  query GetWorkCenters {
    workCenters {
      id
      name
      regionCode
      countryCode
    }
  }
`

export const GET_HIERARCHY_TYPES = gql`
  query GetHierarchyTypes {
    hierarchyTypes {
      id
      name
      color
      rank
      organizationId
    }
  }
`

export const GET_ME = gql`
  query MeProfile {
    me {
      id
      email
      userName
      firstName
      lastName
      lastName
      contractedHours
      systemRole
      allocations {
         id
         project {
           id
           name
           tag
           organization {
             tag
           }
         }
      }
    }
  }
`


