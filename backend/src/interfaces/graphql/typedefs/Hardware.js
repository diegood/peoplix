import gql from 'graphql-tag';

export const HardwareSchema = gql`
type Hardware {
  id: ID!
  name: String!
  type: String!
  serialNumber: String
  assignedDate: String!
  collaboratorId: String!
}

  extend type Mutation {

  
  addHardware(collaboratorId: ID!, name: String!, type: String!, serialNumber: String): Hardware! @auth(requires: ADMIN, sameUser: "collaboratorId")

  removeHardware(id: ID!): Boolean! @auth(requires: ADMIN)
  }

`;
