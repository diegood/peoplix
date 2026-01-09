import gql from 'graphql-tag';

export default gql`
  enum RequirementStatus {
    DRAFT
    PENDING_REVIEW
    VALIDATED
    DEPRECATED
    BLOCKED
  }

  type FunctionalRequirementHistory {
    id: ID!
    requirementId: String!
    versionMajor: Int!
    versionMinor: Int!
    versionPatch: Int!
    diff: String
    changedBy: User
    createdAt: String!
  }

  type FunctionalRequirementRelation {
    id: ID!
    fromId: String!
    from: FunctionalRequirement!
    toId: String!
    to: FunctionalRequirement!
    type: String!
    createdAt: String!
  }

  type FunctionalRequirement {
    id: ID!
    number: Int!
    title: String!
    description: String!
    generalDescription: String
    actors: String
    preconditions: String
    expectedInputs: String
    detailedFlow: String
    validations: String
    expectedOutputs: String
    systemMessages: String
    mockupUrl: String
    notes: String
    status: RequirementStatus!
    versionMajor: Int!
    versionMinor: Int!
    versionPatch: Int!
    createdAt: String!
    updatedAt: String!
    projectId: String!
    analystId: String
    analyst: User
    originalRequirementId: String
    originalRequirement: FunctionalRequirement
    evolutions: [FunctionalRequirement!]
    history: [FunctionalRequirementHistory!]
    workPackages: [WorkPackage!]
    relatedTo: [FunctionalRequirement!]
    relatedFrom: [FunctionalRequirement!]
  }

  extend type Query {
    functionalRequirements(projectId: String!, status: RequirementStatus): [FunctionalRequirement!]
    functionalRequirement(id: String!): FunctionalRequirement
  }

  extend type Mutation {
    createFunctionalRequirement(
        projectId: String!, 
        title: String!, 
        description: String!,
        generalDescription: String,
        actors: String,
        preconditions: String,
        expectedInputs: String,
        detailedFlow: String,
        validations: String,
        expectedOutputs: String,
        systemMessages: String,
        mockupUrl: String,
        notes: String
    ): FunctionalRequirement

    updateFunctionalRequirement(
        id: String!,
        title: String,
        description: String,
        generalDescription: String,
        actors: String,
        preconditions: String,
        expectedInputs: String,
        detailedFlow: String,
        validations: String,
        expectedOutputs: String,
        systemMessages: String,
        mockupUrl: String,
        notes: String,
        status: RequirementStatus,
        versionBump: String
    ): FunctionalRequirement

    deleteFunctionalRequirement(id: String!): FunctionalRequirement

    addFunctionalRequirementRelation(
      fromId: String!,
      toId: String!,
      type: String
    ): FunctionalRequirementRelation

    removeFunctionalRequirementRelation(
      fromId: String!,
      toId: String!
    ): Boolean

    createEvolution(
      originalRequirementId: String!
    ): FunctionalRequirement

    unlockRequirement(
      id: String!
      status: RequirementStatus!
    ): FunctionalRequirement
  }
`;
