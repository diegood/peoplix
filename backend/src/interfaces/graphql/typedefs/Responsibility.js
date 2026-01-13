import gql from 'graphql-tag';

export const ResponsibilitySchema = gql`
  enum RasciRole {
    RESPONSIBLE
    ACCOUNTABLE
    SUPPORT
    CONSULTED
    INFORMED
  }

  type Responsibility {
    id: ID!
    role: RasciRole!
    allocationId: ID!
    workPackageId: ID
    functionalRequirementId: ID
    targetAllocationId: ID
    projectId: ID!
    
    allocation: Allocation!
    workPackage: WorkPackage
    functionalRequirement: FunctionalRequirement
    targetAllocation: Allocation
    project: Project!
    
    updatedAt: String
  }

  extend type Project {
    responsibilities: [Responsibility]
  }

  extend type WorkPackage {
    responsibilities: [Responsibility]
  }

  extend type FunctionalRequirement {
    responsibilities: [Responsibility]
  }
  
  extend type Allocation {
      responsibilities: [Responsibility]
      targetedResponsibilities: [Responsibility]
  }

  extend type Mutation {
    addResponsibility(
      projectId: ID!
      allocationId: ID!
      role: RasciRole!
      workPackageId: ID
      functionalRequirementId: ID
      targetAllocationId: ID
    ): Responsibility

    removeResponsibility(id: ID!): Boolean
  }
`;
