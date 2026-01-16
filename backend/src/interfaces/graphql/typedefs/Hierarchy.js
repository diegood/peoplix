import gql from 'graphql-tag';

export const HierarchySchema = gql`
type HierarchyType {
  id: ID!
  name: String!
  color: String!
  rank: Int!
  organizationId: ID!
}

type AllocationHierarchy {
  id: ID!
  hierarchyType: HierarchyType!
  supervisor: Allocation
  subordinate: Allocation
}


  extend type Query {
    hierarchyTypes: [HierarchyType!]!
  }

  extend type Mutation {
    addAllocationHierarchy(subordinateAllocId: ID!, supervisorAllocId: ID!, typeId: ID!): AllocationHierarchy!
    removeAllocationHierarchy(hierarchyId: ID!): Boolean!
    
    createHierarchyType(name: String!, color: String!, rank: Int!): HierarchyType!
    updateHierarchyType(id: ID!, name: String, color: String, rank: Int): HierarchyType!
    deleteHierarchyType(id: ID!): Boolean!
  }
`;
