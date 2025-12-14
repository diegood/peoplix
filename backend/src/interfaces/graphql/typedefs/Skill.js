import gql from 'graphql-tag';

export const SkillSchema = gql`
type Skill {
  id: ID!
  name: String!
  level: Int! # 0-4
}

  extend type Query {

  skills: [CollaboratorSkill!]!
  }

  extend type Mutation {


  createSkill(name: String!): Skill!

  deleteSkill(id: ID!): Boolean!
  }

`;
