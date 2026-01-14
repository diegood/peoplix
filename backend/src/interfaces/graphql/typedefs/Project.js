import gql from 'graphql-tag';

export const ProjectSchema = gql`
type Project {
  id: ID!
  name: String!
  tag: String
  organization: Organization
  contractedHours: Int!
  startDate: String
  allocations: [Allocation!]
  requiredRoles: [ProjectRequirement!]
  sprints: [Sprint!]
  milestones: [Milestone!]
  workPackages(status: String): [WorkPackage]
  functionalRequirements: [FunctionalRequirement!]
}

type ProjectRequirement {
  id: ID!
  role: Role!
  resourceCount: Int!
  monthlyHours: Int!
  skills: [ProjectRequirementSkill!]!
}

type ProjectRequirementSkill {
  id: ID!
  skill: Skill!
  name: String
  level: Int!
}

  extend type Query {

  projects(search: String): [Project!]! @auth(requires: USER)

  project(id: ID!): Project @auth(requires: USER)
  }

  extend type Mutation {

  createProject(name: String!, contractedHours: Int!, startDate: String): Project! @auth(requires: ADMIN)

  updateProject(id: ID!, name: String, tag: String, contractedHours: Int, startDate: String): Project! @auth(requires: ADMIN)

  deleteProject(id: ID!): Boolean @auth(requires: ADMIN)

  addProjectRequirement(projectId: ID!, roleId: ID!, resourceCount: Int, monthlyHours: Int): ProjectRequirement! @auth(requires: ADMIN)

  updateProjectRequirement(requirementId: ID!, resourceCount: Int, monthlyHours: Int): ProjectRequirement! @auth(requires: ADMIN)

  removeProjectRequirement(projectId: ID!, requirementId: ID!): Boolean @auth(requires: ADMIN)

  addRequirementSkill(projectId: ID!, requirementId: ID!, skillName: String!, level: Int!): ProjectRequirementSkill! @auth(requires: ADMIN)

  removeRequirementSkill(projectId: ID!, requirementId: ID!, skillId: ID!): Boolean @auth(requires: ADMIN)
  }

`;
