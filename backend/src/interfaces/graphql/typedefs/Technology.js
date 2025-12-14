import gql from 'graphql-tag';

export const TechnologySchema = gql`
type Technology {
  id: ID!
  name: String!
}

  extend type Query {

  technologies: [Technology!]!
  }

  extend type Mutation {


  createTechnology(name: String!): Technology!

  deleteTechnology(id: ID!): Boolean!
  }

`;
