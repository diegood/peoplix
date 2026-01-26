import gql from 'graphql-tag';

export const AuthSchema = gql`
  type AuthPayload {
    token: String

    user: Collaborator
    availableOrganizations: [Organization]
  }

  input LoginInput {
    firebaseToken: String!
    recaptchaToken: String!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthPayload
    switchOrganization(organizationId: ID!): AuthPayload
  }

  extend type Query {
    me: Collaborator
  }
`;
