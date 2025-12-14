import gql from 'graphql-tag';

export const SkillSchema = gql`
  type Skill {
    id: ID!
    name: String!
  }

  extend type Query {
    skills: [Skill!]!
  }

  extend type Mutation {
    createSkill(name: String!): Skill!
    deleteSkill(id: ID!): Boolean!
  }

`;
