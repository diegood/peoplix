import gql from 'graphql-tag'

export const LOGIN_MUTATION = gql`
  mutation Login($firebaseToken: String!, $recaptchaToken: String!) {
    login(input: { firebaseToken: $firebaseToken, recaptchaToken: $recaptchaToken }) {
      token
      user {
        id
        userName
        firstName
        lastName
        systemRole
        organizationId
        organization {
          tag
        }
        id
        firstName
        lastName
      }
      availableOrganizations {
        id
        name
        tag
        isActive
      }
    }
  }
`

export const ME_QUERY = gql`
  query Me {
    me {
      id
      userName
      firstName
      lastName
      systemRole
      organizationId
      organization {
        tag
      }
    }
  }
`

export const SWITCH_ORGANIZATION_MUTATION = gql`
  mutation SwitchOrganization($organizationId: ID!) {
    switchOrganization(organizationId: $organizationId) {
      token
      user {
        id
        userName
        firstName
        lastName
        systemRole
        organizationId
        organization {
          tag
        }
      }
      availableOrganizations {
        id
        name
        tag
        isActive
      }
    }
  }
`
