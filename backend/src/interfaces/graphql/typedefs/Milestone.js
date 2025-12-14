import gql from 'graphql-tag';

export const MilestoneSchema = gql`
type Milestone {
  id: ID!
  name: String!
  date: String!
  type: String
  milestoneType: MilestoneType
  projectId: String!
}

type MilestoneType {
  id: ID!
  name: String!
  color: String!
}

  extend type Query {

  milestoneTypes: [MilestoneType!]!
  }

  extend type Mutation {




  createMilestone(projectId: ID!, name: String!, date: String!, type: String, milestoneTypeId: ID): Milestone!

  deleteMilestone(id: ID!): Boolean

  
  createMilestoneType(name: String!, color: String!): MilestoneType!

  updateMilestoneType(id: ID!, name: String, color: String): MilestoneType!

  deleteMilestoneType(id: ID!): Boolean!
  }

`;
