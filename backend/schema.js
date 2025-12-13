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

type Hardware {
  id: ID!
  name: String!
  type: String!
  serialNumber: String
  assignedDate: String!
  collaboratorId: String!
}

type HolidayCalendar {
  id: ID!
  year: Int!
  holidays: [String!]!
  lastModified: String!
  collaboratorId: String!
}

type CustomFieldDefinition {
  id: ID!
  fieldName: String!
  fieldLabel: String!
  fieldType: String!
  fieldConfig: String!
  isRequired: Boolean!
  order: Int!
}

type CustomFieldValue {
  id: ID!
  fieldDefinitionId: String!
  fieldDefinition: CustomFieldDefinition!
  value: String!
}

type CollaboratorSkill {
  id: ID!
  skill: Skill!
  level: Int!
}

type Collaborator {
  id: ID!
  userName: String
  firstName: String!
  lastName: String!
  name: String # Deprecated
  avatar: String
  roles: [Role!]!
  skills: [CollaboratorSkill!]!
  contractedHours: Int!
  joinDate: String!
  isActive: Boolean!
  allocations: [Allocation!]!
  hardware: [Hardware!]!
  holidayCalendar: HolidayCalendar
  customFields: [CustomFieldValue!]!
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

type AllocationHierarchy {
  id: ID!
  hierarchyType: HierarchyType!
  supervisor: Allocation
  subordinate: Allocation
}

type HierarchyType {
  id: ID!
  name: String!
  color: String!
  rank: Int!
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
  supervisors: [AllocationHierarchy!]
  subordinates: [AllocationHierarchy!]
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
  name: String
  level: Int!
}

type Query {
  projects: [Project!]!
  collaborators: [Collaborator!]!
  roles: [Role!]!
  skills: [Skill!]!
  technologies: [Technology!]!
  milestoneTypes: [MilestoneType!]!
  customFieldDefinitions: [CustomFieldDefinition!]!
  project(id: ID!): Project
}

type Mutation {
  createProject(name: String!, contractedHours: Int!): Project!
  deleteProject(id: ID!): Boolean
  
  createCollaborator(userName: String, firstName: String!, lastName: String!, contractedHours: Int!, joinDate: String): Collaborator!
  updateCollaborator(id: ID!, userName: String, firstName: String, lastName: String, contractedHours: Int, joinDate: String, isActive: Boolean): Collaborator!
  deleteCollaborator(id: ID!): Boolean
  
  # Hardware Management
  addHardware(collaboratorId: ID!, name: String!, type: String!, serialNumber: String): Hardware!
  removeHardware(id: ID!): Boolean
  
  # Holiday Calendar Management
  updateHolidayCalendar(collaboratorId: ID!, year: Int!, holidays: [String!]!): HolidayCalendar!
  
  # Custom Field Definitions
  createCustomFieldDefinition(fieldName: String!, fieldLabel: String!, fieldType: String!, fieldConfig: String, isRequired: Boolean, order: Int): CustomFieldDefinition!
  updateCustomFieldDefinition(id: ID!, fieldName: String, fieldLabel: String, fieldType: String, fieldConfig: String, isRequired: Boolean, order: Int): CustomFieldDefinition!
  deleteCustomFieldDefinition(id: ID!): Boolean
  
  # Custom Field Values
  setCustomFieldValue(collaboratorId: ID!, fieldDefinitionId: ID!, value: String!): CustomFieldValue!
  
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
}


type Technology {
  id: ID!
  name: String!
}
`
