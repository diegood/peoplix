import gql from 'graphql-tag'

export const ROLE_FRAGMENT = gql`
  fragment RoleFields on Role {
    id
    name
  }
`

export const SKILL_FRAGMENT = gql`
  fragment SkillFields on Skill {
    id
    name
  }
`

export const SKILL_WITH_LEVEL_FRAGMENT = gql`
  fragment SkillWithLevelFields on CollaboratorSkill {
    id
    level
    skill {
      ...SkillFields
    }
  }
  ${SKILL_FRAGMENT}
`

export const COLLABORATOR_FRAGMENT = gql`
  fragment CollaboratorFields on Collaborator {
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
`

export const PROJECT_FRAGMENT = gql`
  fragment ProjectFields on Project {
    id
    name
    contractedHours
  }
`

export const MILESTONE_TYPE_FRAGMENT = gql`
  fragment MilestoneTypeFields on MilestoneType {
    id
    name
    color
  }
`

export const HIERARCHY_TYPE_FRAGMENT = gql`
  fragment HierarchyTypeFields on HierarchyType {
    id
    name
    color
  }
`

export const HARDWARE_FRAGMENT = gql`
  fragment HardwareFields on Hardware {
    id
    name
    type
    serialNumber
    assignedDate
  }
`

export const HOLIDAY_CALENDAR_FRAGMENT = gql`
  fragment HolidayCalendarFields on HolidayCalendar {
    id
    year
    holidays
    lastModified
  }
`

export const CUSTOM_FIELD_DEFINITION_FRAGMENT = gql`
  fragment CustomFieldDefinitionFields on CustomFieldDefinition {
     id
     fieldName
     fieldLabel
     fieldType
     fieldConfig
     isRequired
     order
  }
`

export const CUSTOM_FIELD_VALUE_FRAGMENT = gql`
  fragment CustomFieldValueFields on CustomFieldValue {
    id
    value
    fieldDefinition {
      ...CustomFieldDefinitionFields
    }
  }
  ${CUSTOM_FIELD_DEFINITION_FRAGMENT}
`
