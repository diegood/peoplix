import gql from 'graphql-tag'
import { MILESTONE_TYPE_FRAGMENT } from '@/graphql/fragments'

export const GET_TECHNOLOGIES = gql`
  query GetTechnologies {
    technologies {
      id
      name
    }
  }
`

export const GET_MILESTONE_TYPES = gql`
  query GetMilestoneTypes {
    milestoneTypes {
      ...MilestoneTypeFields
    }
  }
  ${MILESTONE_TYPE_FRAGMENT}
`
