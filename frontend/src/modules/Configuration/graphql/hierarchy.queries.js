import gql from 'graphql-tag'

export const GET_ORG_HIERARCHY = gql`
  query GetOrgHierarchy($organizationId: ID!) {
    orgHierarchy(organizationId: $organizationId) {
      id
      supervisor {
        id
        firstName
        lastName
        roles {
          id
          name
          isAdministrative
        }
      }
      subordinate {
        id
        firstName
        lastName
        roles {
          id
          name
          isAdministrative
        }
      }
      hierarchyType {
        id
        name
        color
      }
    }
  }
`

export const ADD_ORG_HIERARCHY = gql`
  mutation AddOrgHierarchy($supervisorId: ID!, $subordinateId: ID!, $hierarchyTypeId: ID!) {
    addOrgHierarchy(supervisorId: $supervisorId, subordinateId: $subordinateId, hierarchyTypeId: $hierarchyTypeId) {
      id
    }
  }
`

export const REMOVE_ORG_HIERARCHY = gql`
  mutation RemoveOrgHierarchy($id: ID!) {
    removeOrgHierarchy(id: $id)
  }
`

export const GET_COLLABORATORS_WITH_ROLES = gql`
  query GetCollaboratorsWithRoles {
    collaborators {
      id
      firstName
      lastName
      roles {
        id
        name
        isAdministrative
      }
    }
  }
`

export const GET_PROJECT_DETAILS = gql`
  query GetProjectDetails($id: ID!) {
    project(id: $id) {
      id
      name
      organization {
        id
      }
      allocations {
        id
        dedicationPercentage
        roles {
            id
            name
            isAdministrative
        }
        collaborator {
          id
          firstName
          lastName
          roles {
             id
             name
             isAdministrative
          }
        }
        supervisors {
          id
          hierarchyType {
            id
            name
            color
          }
          supervisor {
            id
            collaborator {
              id
              firstName
              lastName
            }
          }
        }
        subordinates {
          id
          hierarchyType {
            id
            name
            color
          }
          subordinate {
            id
            collaborator {
              id
              firstName
              lastName
            }
          }
        }
      }
      requiredRoles {
        id
        role {
            id
            name
        }
      }
    }
  }
`
