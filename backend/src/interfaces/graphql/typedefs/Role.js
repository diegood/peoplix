import gql from 'graphql-tag';

export const RoleSchema = gql`
type Role {
  id: ID!
  name: String!
}

  extend type Query {

  roles: [Role!]!
  }

  extend type Mutation {


  createRole(name: String!): Role!

  deleteRole(id: ID!): Boolean!
  }

`;
