import gql from 'graphql-tag';

export const AbsenceSchema = gql`
  type AbsenceType {
    id: ID!
    name: String!
    color: String!
    isPaid: Boolean!
    requiresApproval: Boolean!
    isVacation: Boolean!
  }

  type Absence {
    id: ID!
    collaboratorId: ID!
    collaborator: Collaborator!
    typeId: ID!
    type: AbsenceType!
    startDate: String!
    endDate: String!
    status: String!
    reason: String
    daysConsumed: Float!
  }

  extend type Query {
    absenceTypes: [AbsenceType!]!
    absences(collaboratorId: ID, projectId: ID, startDate: String, endDate: String): [Absence!]!
  }

  extend type Mutation {
    # Configuration
    createAbsenceType(name: String!, color: String!, isPaid: Boolean!, requiresApproval: Boolean!, isVacation: Boolean!): AbsenceType!
    updateAbsenceType(id: ID!, name: String, color: String, isPaid: Boolean, requiresApproval: Boolean, isVacation: Boolean): AbsenceType!
    deleteAbsenceType(id: ID!): Boolean!

    # Management
    requestAbsence(collaboratorId: ID!, typeId: ID!, startDate: String!, endDate: String!, reason: String): Absence!
    updateAbsenceStatus(id: ID!, status: String!): Absence!
    deleteAbsence(id: ID!): Boolean!
    
    # Vacation Config
    updateCollaboratorVacationConfig(collaboratorId: ID!, year: Int!, days: Int!): Collaborator!
  }
`;
