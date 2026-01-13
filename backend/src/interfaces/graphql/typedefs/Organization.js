import gql from 'graphql-tag';

export const OrganizationSchema = gql`
  type Organization {
    id: ID!
    name: String!
    tag: String
    workingSchedule: JSON
    isActive: Boolean
    admins: [Collaborator]
  }

  extend type Query {
    organization: Organization
    allOrganizations: [Organization!]!
    organizationAdmins(organizationId: ID!): [Collaborator]
  }

  extend type Mutation {
    createOrganization(name: String!, tag: String, adminEmail: String!, adminPassword: String!, adminFirstName: String!, adminLastName: String!): Organization!
    updateOrganization(id: ID, name: String, tag: String, workingSchedule: JSON): Organization!
    toggleOrganizationStatus(id: ID!, isActive: Boolean!): Organization!
  }
`;
