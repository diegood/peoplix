import gql from 'graphql-tag';

export const CollaboratorHierarchySchema = gql`
  type CollaboratorHierarchy {
    id: ID!
    supervisor: Collaborator!
    subordinate: Collaborator!
    hierarchyType: HierarchyType!
  }

  extend type Query {
    orgHierarchy(organizationId: ID!): [CollaboratorHierarchy!]!
  }

  extend type Mutation {
    addOrgHierarchy(supervisorId: ID!, subordinateId: ID!, hierarchyTypeId: ID!): CollaboratorHierarchy!
    removeOrgHierarchy(id: ID!): Boolean!
  }
`;
