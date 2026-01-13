import gql from 'graphql-tag'

export const GET_HIERARCHY_TYPES = gql`
  query GetHierarchyTypes {
    hierarchyTypes {
      id
      name
      color
      rank
    }
  }
`
