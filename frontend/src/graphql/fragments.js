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

export const HOLIDAY_CALENDAR_FRAGMENT = gql`
  fragment HolidayCalendarFields on HolidayCalendar {
    id
    year
    holidays
    lastModified
  }
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
    absences {
      id
      startDate
      endDate
      type {
        id
        name
        color
      }
    }
    holidayCalendar {
      ...HolidayCalendarFields
    }
  }
  ${HOLIDAY_CALENDAR_FRAGMENT}
`

export const PROJECT_FRAGMENT = gql`
  fragment ProjectFields on Project {
    id
    name
    contractedHours
    startDate
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

export const TASK_ESTIMATION_FRAGMENT = gql`
  fragment TaskEstimationFields on TaskEstimation {
    id
    hours
    startDate
    endDate
    role {
      ...RoleFields
    }
    collaborator {
      ...CollaboratorFields
    }
  }
  ${ROLE_FRAGMENT}
  ${COLLABORATOR_FRAGMENT}
`

export const TASK_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    name
    description
    startDate
    endDate
    collaborator {
      ...CollaboratorFields
    }
    estimations {
      ...TaskEstimationFields
    }
    dependencies {
        id
        name
        endDate
    }
  }
  ${COLLABORATOR_FRAGMENT}
  ${TASK_ESTIMATION_FRAGMENT}
`

export const WORK_PACKAGE_FRAGMENT = gql`
  fragment WorkPackageFields on WorkPackage {
    id
    name
    description
    startDate
    endDate
    highLevelEstimation
    status
    tasks {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`
