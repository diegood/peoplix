
import gql from 'graphql-tag'

export const DELETE_ORGANIZATION_MUTATION = gql`
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id)
  }
`

export const ALL_ORGANIZATIONS_QUERY = gql`
  query AllOrganizations {
    allOrganizations {
      id
      name
      tag
      workingSchedule
      isActive
      activeCollaboratorsCount
      admins {
        id
        firstName
        lastName
        email
      }
    }
    totalActiveUsers
  }
`

export const TOGGLE_ORG_STATUS_MUTATION = gql`
  mutation ToggleOrganizationStatus($id: ID!, $isActive: Boolean!) {
    toggleOrganizationStatus(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`

export const CREATE_ADMIN_MUTATION = gql`
  mutation CreateCollaborator($organizationId: ID!, $firstName: String!, $lastName: String!, $email: String!, $password: String!) {
     createCollaborator(firstName: $firstName, lastName: $lastName, userName: $email, password: $password, contractedHours: 160, joinDate: "2023-01-01", systemRole: 1, organizationId: $organizationId) {
        id
     }
  }
`

export const CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($name: String!, $tag: String, $adminEmail: String!, $adminPassword: String!, $adminFirstName: String!, $adminLastName: String!) {
    createOrganization(name: $name, tag: $tag, adminEmail: $adminEmail, adminPassword: $adminPassword, adminFirstName: $adminFirstName, adminLastName: $adminLastName) {
      id
      name
      tag
    }
  }
`

export const GET_ORG_COLLABORATORS = gql`
  query GetOrgCollaborators($organizationId: ID!, $search: String) {
    collaborators(organizationId: $organizationId, search: $search) {
      id
      firstName
      lastName
      email
      systemRole
      isActive
    }
  }
`

export const UPDATE_COLLABORATOR_ROLE = gql`
  mutation UpdateCollaboratorRole($id: ID!, $systemRole: Int!) {
    updateCollaborator(id: $id, systemRole: $systemRole) {
      id
      systemRole
    }
  }
`
export const UPDATE_ORGANIZATION_MUTATION = gql`
  mutation UpdateOrganization($id: ID, $name: String, $tag: String) {
    updateOrganization(id: $id, name: $name, tag: $tag) {
      id
      name
      tag
    }
  }
`
