import gql from 'graphql-tag';

export const ProjectSchema = gql`
type Project {
  id: ID!
  name: String!
  contractedHours: Int!
  startDate: String
  allocations: [Allocation!]
  requiredRoles: [ProjectRequirement!]
  sprints: [Sprint!]
  milestones: [Milestone!]
  workPackages(status: String): [WorkPackage]
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

  projects(search: String): [Project!]!

  project: Project!
  }

  extend type Mutation {

  createProject(name: String!, contractedHours: Int!, startDate: String): Project!

  updateProject(id: ID!, name: String, contractedHours: Int, startDate: String): Project!

  deleteProject(id: ID!): Boolean

  addProjectRequirement(projectId: ID!, roleId: ID!, resourceCount: Int, monthlyHours: Int): ProjectRequirement!

  updateProjectRequirement(requirementId: ID!, resourceCount: Int, monthlyHours: Int): ProjectRequirement!


  removeProjectRequirement(projectId: ID!, requirementId: ID!): Boolean

  addRequirementSkill(projectId: ID!, requirementId: ID!, skillName: String!, level: Int!): ProjectRequirementSkill!

  removeRequirementSkill(projectId: ID!, requirementId: ID!, skillId: ID!): Boolean
  }

`;
