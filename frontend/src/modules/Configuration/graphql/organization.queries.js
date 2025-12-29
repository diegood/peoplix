import gql from 'graphql-tag'

export const GET_ORGANIZATION = gql`
  query GetOrganization {
    organization {
      id
      name
      workingSchedule
    }
  }
`

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($workingSchedule: JSON) {
    updateOrganization(workingSchedule: $workingSchedule) {
      id
      workingSchedule
    }
  }
`
