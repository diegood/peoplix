import gql from 'graphql-tag';

export const CollaboratorSchema = gql`
type Collaborator {
  id: ID!
  userName: String
  firstName: String!
  lastName: String!

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

type CollaboratorSkill {
  id: ID!
  skill: Skill!
  level: Int!
}

  extend type Query {

  collaborators(search: String): [Collaborator!]!
  }

  extend type Mutation {

  
  createCollaborator(userName: String, firstName: String!, lastName: String!, contractedHours: Int!, joinDate: String!): Collaborator!

  updateCollaborator(id: ID!, userName: String, firstName: String, lastName: String, contractedHours: Int, joinDate: String, isActive: Boolean, workCenterId: ID): Collaborator!

  deleteCollaborator(id: ID!): Boolean!

  
  addCollaboratorSkill(collaboratorId: ID!, skillId: ID!, level: Int!): Collaborator!

  removeCollaboratorSkill(collaboratorId: ID!, skillId: ID!): Collaborator!

  
  addCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator!

  removeCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator!
  }

`;
