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
  supervisors: [AllocationHierarchy!]!
  subordinates: [AllocationHierarchy!]!
}

type AllocationHierarchy {
  id: ID!
  subordinate: Allocation!
  supervisor: Allocation!
  hierarchyType: HierarchyType!
}

type HierarchyType {
  id: ID!
  name: String!
  color: String
  rank: Int
}

type MilestoneType {
  id: ID!
  name: String!
  color: String!
}

type Milestone {
  id: ID!
  project: Project!
  name: String!
  date: String!
  type: String
  milestoneType: MilestoneType
}

type ProjectRequirement {
  id: ID!
  role: Role!
  resourceCount: Int!
  monthlyHours: Int!
  skills: [Skill!]!
}

type Query {
  projects: [Project!]!
  project(id: ID!): Project
  collaborators: [Collaborator!]!
  roles: [Role!]!
  technologies: [Technology!]!
  milestoneTypes: [MilestoneType!]!
  hierarchyTypes: [HierarchyType!]!
}

type Mutation {
  createRole(name: String!): Role
  deleteRole(id: ID!): ID
  createProject(name: String!, contractedHours: Int!): Project
  
  # Allocation Management
  createAllocation(projectId: ID!, collaboratorId: ID!, roleId: ID!, percentage: Int!, startWeek: String!): Allocation!
  updateAllocation(allocationId: ID!, percentage: Int, endWeek: String): Allocation! 
  deleteAllocation(allocationId: ID!): ID
  addAllocationRole(allocationId: ID!, roleId: ID!): Role!
  removeAllocationRole(allocationId: ID!, roleId: ID!): ID
  
  # Hierarchies
  addAllocationHierarchy(subordinateAllocId: ID!, supervisorAllocId: ID!, typeId: ID!): AllocationHierarchy
  removeAllocationHierarchy(hierarchyId: ID!): Boolean
  
  # Milestones
  createMilestone(projectId: ID!, name: String!, date: String!, type: String, milestoneTypeId: ID): Milestone!
  deleteMilestone(id: ID!): ID
  
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

  createMilestoneType(name: String!, color: String!): MilestoneType!
  updateMilestoneType(id: ID!, name: String, color: String): MilestoneType!
  deleteMilestoneType(id: ID!): Boolean

  createHierarchyType(name: String!, color: String, rank: Int): HierarchyType!
  updateHierarchyType(id: ID!, name: String, color: String, rank: Int): HierarchyType!
  deleteHierarchyType(id: ID!): Boolean
}

type Technology {
  id: ID!
  name: String!
}
`
