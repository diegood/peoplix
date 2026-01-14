import gql from 'graphql-tag';

export const OrganizationSchema = gql`
  type Organization {
    id: ID!
    name: String!
    tag: String
    workingSchedule: JSON
    isActive: Boolean
    admins: [Collaborator]
    activeCollaboratorsCount: Int
  }

  extend type Query {
    organization: Organization
    allOrganizations: [Organization!]! @auth(requires: SUPER_ADMIN)
    totalActiveUsers: Int! @auth(requires: SUPER_ADMIN)
    organizationAdmins(organizationId: ID!): [Collaborator] @auth(requires: SUPER_ADMIN)
  }

  extend type Mutation {
    createOrganization(name: String!, tag: String, adminEmail: String!, adminPassword: String!, adminFirstName: String!, adminLastName: String!): Organization! @auth(requires: SUPER_ADMIN)
    updateOrganization(id: ID, name: String, tag: String, workingSchedule: JSON): Organization! @auth(requires: ADMIN)
    toggleOrganizationStatus(id: ID!, isActive: Boolean!): Organization! @auth(requires: SUPER_ADMIN)
    deleteOrganization(id: ID!): Boolean! @auth(requires: SUPER_ADMIN)
  }
`;
