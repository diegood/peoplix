import gql from 'graphql-tag';

export const AuthSchema = gql`
  type AuthPayload {
    token: String
    user: Collaborator
  }

  input LoginInput {
    username: String!
    password: String!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthPayload
  }

  extend type Query {
    me: Collaborator
  }
`;
