import gql from 'graphql-tag'

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      token
      user {
        id
        userName
        firstName
        lastName
        systemRole
        organizationId
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
    }
  }
`
