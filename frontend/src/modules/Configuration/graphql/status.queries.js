import gql from 'graphql-tag'

export const GET_WORK_PACKAGE_STATUSES = gql`
  query GetWorkPackageStatuses($organizationId: ID!) {
    workPackageStatuses(organizationId: $organizationId) {
      id
      name
      color
      order
      isClosed
    }
  }
`

export const CREATE_STATUS = gql`
    mutation CreateWorkPackageStatus($organizationId: ID!, $name: String!, $color: String, $order: Int, $isClosed: Boolean) {
        createWorkPackageStatus(organizationId: $organizationId, name: $name, color: $color, order: $order, isClosed: $isClosed) {
            id
            name
            color
            order
            isClosed
        }
    }
`

export const UPDATE_STATUS = gql`
    mutation UpdateWorkPackageStatus($id: ID!, $name: String, $color: String, $order: Int, $isClosed: Boolean) {
        updateWorkPackageStatus(id: $id, name: $name, color: $color, order: $order, isClosed: $isClosed) {
            id
            name
            color
            order
            isClosed
        }
    }
`

export const DELETE_STATUS = gql`
    mutation DeleteWorkPackageStatus($id: ID!) {
        deleteWorkPackageStatus(id: $id)
    }
`
