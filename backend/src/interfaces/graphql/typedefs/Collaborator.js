import gql from 'graphql-tag';

export const CollaboratorSchema = gql`
type Collaborator {
  id: ID!
  email: String
  userName: String
  firstName: String!
  lastName: String!
  systemRole: Int
  organizationId: ID

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
  workCenter: WorkCenter
  vacationDaysPerYear: JSON
  absences: [Absence]
  skillHistory: [CollaboratorSkillHistory!]!
  careerObjectives: [CollaboratorCareerObjective!]!
  projectSkills: [Skill!]!
  meetings: [CollaboratorMeeting!]!
}

type CollaboratorMeeting {
  id: ID!
  date: String!
  notes: String
  actionItems: [MeetingActionItem!]!
}

type MeetingActionItem {
  id: ID!
  description: String!
  status: String!
  meetingId: ID!
}

type CollaboratorSkillHistory {
  id: ID!
  level: Int!
  createdAt: String!
  skill: Skill!
}

type CollaboratorCareerObjective {
  id: ID!
  year: Int!
  quarter: Int!
  description: String!
  status: String!
  skill: Skill
  targetLevel: Int
}

type CollaboratorSkill {
  id: ID!
  skill: Skill!
  level: Int!
}

  extend type Query {
    collaborator(id: ID!): Collaborator
    collaborators(search: String): [Collaborator!]!
  }

  extend type Mutation {
    createCollaborator(userName: String, firstName: String!, lastName: String!, contractedHours: Int!, joinDate: String!, workCenterId: ID, password: String, systemRole: Int): Collaborator!
    updateCollaborator(id: ID!, userName: String, firstName: String, lastName: String, contractedHours: Int, joinDate: String, isActive: Boolean, workCenterId: ID, password: String, systemRole: Int): Collaborator!
    deleteCollaborator(id: ID!): Boolean!
    
    addCollaboratorSkill(collaboratorId: ID!, skillId: ID!, level: Int!): Collaborator!
    removeCollaboratorSkill(collaboratorId: ID!, skillId: ID!): Collaborator!
    
    addCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator!
    removeCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator!
    
    addCollaboratorCareerObjective(collaboratorId: ID!, year: Int!, quarter: Int!, description: String!, skillId: ID, targetLevel: Int): CollaboratorCareerObjective!
    updateCollaboratorCareerObjective(id: ID!, status: String!): CollaboratorCareerObjective!
    deleteCollaboratorCareerObjective(id: ID!): Boolean!
    
    addCollaboratorMeeting(collaboratorId: ID!, date: String!, notes: String): CollaboratorMeeting!
    updateCollaboratorMeeting(id: ID!, date: String, notes: String): CollaboratorMeeting!
    deleteCollaboratorMeeting(id: ID!): Boolean!
    
    addMeetingActionItem(meetingId: ID!, description: String!): MeetingActionItem!
    updateMeetingActionItem(id: ID!, status: String, description: String): MeetingActionItem!
    deleteMeetingActionItem(id: ID!): Boolean!
  }

`;
