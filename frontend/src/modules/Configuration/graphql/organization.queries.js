import gql from 'graphql-tag'

export const GET_ORGANIZATION = gql`
  query GetOrganization {
    organization {
      id
      name
      tag
      workingSchedule
    }
  }
`

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($name: String, $tag: String, $workingSchedule: JSON) {
    updateOrganization(name: $name, tag: $tag, workingSchedule: $workingSchedule) {
      id
      name
      tag
      workingSchedule
    }
  }
`
