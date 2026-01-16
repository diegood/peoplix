import gql from 'graphql-tag';

export const RoleSchema = gql`
type Role {
  id: ID!
  name: String!
  isAdministrative: Boolean
}

  extend type Query {

  roles: [Role!]!
  }

  extend type Mutation {


  createRole(name: String!, isAdministrative: Boolean): Role!
  updateRole(id: ID!, name: String, isAdministrative: Boolean): Role!

  deleteRole(id: ID!): Boolean!
  }

`;
