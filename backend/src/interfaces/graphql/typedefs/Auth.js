import gql from 'graphql-tag';

export const AuthSchema = gql`
  type AuthPayload {
    token: String

    user: Collaborator
    availableOrganizations: [Organization]
  }

  input LoginInput {
    username: String!
    password: String!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthPayload
    switchOrganization(organizationId: ID!): AuthPayload
  }

  extend type Query {
    me: Collaborator
  }
`;
