import gql from 'graphql-tag';

export const AllocationSchema = gql`
type Allocation {
  id: ID!
  collaborator: Collaborator!
  project: Project!
  roles: [Role!]!
  dedicationPercentage: Int!
  hours: Float!
  startWeek: String!
  endWeek: String
  supervisors: [AllocationHierarchy!]
  subordinates: [AllocationHierarchy!]
}

  extend type Mutation {


  createAllocation(projectId: ID!, collaboratorId: ID!, roleId: ID!, percentage: Int!, startWeek: String!, endWeek: String): Allocation!

  updateAllocation(allocationId: ID!, percentage: Int, startWeek: String, endWeek: String): Allocation!

  deleteAllocation(id: ID!): Boolean!

  
  addAllocationRole(allocationId: ID!, roleId: ID!): Role!

  removeAllocationRole(allocationId: ID!, roleId: ID!): Boolean!
  }

`;
