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
  organization: Organization

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
  workingSchedule: JSON
  useCustomSchedule: Boolean
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
    collaborator(id: ID!): Collaborator @auth(requires: ADMIN, sameUser: "id")
    collaborators(search: String, organizationId: ID, availableOnly: Boolean, week: String): [Collaborator!]! @auth(requires: USER)
    searchGlobalUsers(search: String!): [Collaborator!]! @auth(requires: ADMIN)
  }

  extend type Mutation {
    createCollaborator(userName: String, email: String, firstName: String!, lastName: String!, contractedHours: Int!, joinDate: String!, workCenterId: ID, password: String, systemRole: Int, workingSchedule: JSON, useCustomSchedule: Boolean, organizationId: ID): Collaborator! @auth(requires: ADMIN)
    updateCollaborator(id: ID!, userName: String, firstName: String, lastName: String, contractedHours: Int, joinDate: String, isActive: Boolean, workCenterId: ID, password: String, systemRole: Int, workingSchedule: JSON, useCustomSchedule: Boolean): Collaborator! @auth(requires: ADMIN, sameUser: "id")
    deleteCollaborator(id: ID!): Boolean! @auth(requires: ADMIN)
    
    addCollaboratorSkill(collaboratorId: ID!, skillId: ID!, level: Int!): Collaborator! @auth(requires: ADMIN, sameUser: "collaboratorId")
    removeCollaboratorSkill(collaboratorId: ID!, skillId: ID!): Collaborator! @auth(requires: ADMIN, sameUser: "collaboratorId")
    
    addCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator! @auth(requires: ADMIN)
    removeCollaboratorRole(collaboratorId: ID!, roleId: ID!): Collaborator! @auth(requires: ADMIN)
    
    addCollaboratorCareerObjective(collaboratorId: ID!, year: Int!, quarter: Int!, description: String!, skillId: ID, targetLevel: Int): CollaboratorCareerObjective! @auth(requires: ADMIN, sameUser: "collaboratorId")
    updateCollaboratorCareerObjective(id: ID!, status: String!): CollaboratorCareerObjective! @auth(requires: ADMIN)
    deleteCollaboratorCareerObjective(id: ID!): Boolean! @auth(requires: ADMIN)
    
    addCollaboratorMeeting(collaboratorId: ID!, date: String!, notes: String): CollaboratorMeeting! @auth(requires: ADMIN)
    updateCollaboratorMeeting(id: ID!, date: String, notes: String): CollaboratorMeeting! @auth(requires: ADMIN)
    deleteCollaboratorMeeting(id: ID!): Boolean! @auth(requires: ADMIN)
    
    addMeetingActionItem(meetingId: ID!, description: String!): MeetingActionItem! @auth(requires: ADMIN)
    updateMeetingActionItem(id: ID!, status: String, description: String): MeetingActionItem! @auth(requires: ADMIN)
    deleteMeetingActionItem(id: ID!): Boolean! @auth(requires: ADMIN)
  }

`;
