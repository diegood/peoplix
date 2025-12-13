export const schema = `
type Role {
  id: ID!
  name: String!
}

type Skill {
  id: ID!
  name: String!
  level: Int! # 0-4
}

type Collaborator {
  id: ID!
  name: String!
  avatar: String
  roles: [Role!]!
  skills: [Skill!]!
  contractedHours: Int!
  allocations: [Allocation!]!
}

type Project {
  id: ID!
  name: String!
  contractedHours: Int!
  allocations: [Allocation!]
  requiredRoles: [ProjectRequirement!]
  sprints: [Sprint!]
  milestones: [Milestone!]
}

type Sprint {
  id: ID!
  name: String!
  startDate: String!
  endDate: String!
}

type Allocation {
  id: ID!
  collaborator: Collaborator!
  project: Project!
  roles: [Role!]!
  dedicationPercentage: Int!
  hours: Int!
  startWeek: String!
  endWeek: String
}

type MilestoneType {
  id: ID!
  name: String!
  color: String!
}

type Milestone {
  id: ID!
  name: String!
  date: String!
  type: String
  milestoneType: MilestoneType
  projectId: String!
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
  level: Int!
}

type Query {
  projects: [Project!]!
  collaborators: [Collaborator!]!
  roles: [Role!]!
  skills: [Skill!]!
  technologies: [Technology!]!
  milestoneTypes: [MilestoneType!]!
  project(id: ID!): Project
}

type Mutation {
  createProject(name: String!, contractedHours: Int!): Project!
  deleteProject(id: ID!): Boolean
  
  createCollaborator(name: String!, contractedHours: Int!): Collaborator!
  deleteCollaborator(id: ID!): Boolean
  
  createRole(name: String!): Role!
  deleteRole(id: ID!): Boolean

  createSkill(name: String!): Skill!
  deleteSkill(id: ID!): Boolean
  
  createTechnology(name: String!): Technology!
  deleteTechnology(id: ID!): Boolean
  
  createMilestoneType(name: String!, color: String!): MilestoneType!
  updateMilestoneType(id: ID!, name: String, color: String): MilestoneType!
  deleteMilestoneType(id: ID!): Boolean

  createAllocation(projectId: ID!, collaboratorId: ID!, roleId: ID!, percentage: Int!, startWeek: String!): Allocation!
  updateAllocation(allocationId: ID!, percentage: Int, startWeek: String, endWeek: String): Allocation!
  deleteAllocation(allocationId: ID!): Boolean
  
  addAllocationRole(allocationId: ID!, roleId: ID!): Allocation!
  removeAllocationRole(allocationId: ID!, roleId: ID!): Allocation!

  addCollaboratorSkill(collaboratorId: ID!, skillId: ID!, level: Int!): Collaborator!
  removeCollaboratorSkill(collaboratorId: ID!, skillId: ID!): Collaborator!

  createMilestone(projectId: ID!, name: String!, date: String!, type: String, milestoneTypeId: ID): Milestone!
  deleteMilestone(id: ID!): Boolean
  
  # Requirements Management
  addProjectRequirement(projectId: ID!, roleId: ID!, resourceCount: Int, monthlyHours: Int): ProjectRequirement!
  removeProjectRequirement(projectId: ID!, requirementId: ID!): Boolean
  addRequirementSkill(projectId: ID!, requirementId: ID!, skillName: String!, level: Int!): Skill!
  removeRequirementSkill(projectId: ID!, requirementId: ID!, skillId: ID!): Boolean
  
  createCollaborator(name: String!, contractedHours: Int!): Collaborator!
  addCollaboratorSkill(collaboratorId: ID!, skillName: String!, level: Int!): Skill!
  removeCollaboratorSkill(collaboratorId: ID!, skillId: ID!): Boolean
  
  createTechnology(name: String!): Technology!
  deleteTechnology(id: ID!): ID
}

type Technology {
  id: ID!
  name: String!
}
`
