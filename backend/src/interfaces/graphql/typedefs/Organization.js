import gql from 'graphql-tag';

export const OrganizationSchema = gql`
  type Organization {
    id: ID!
    name: String!
    tag: String
    workingSchedule: JSON
  }

  extend type Query {
    organization: Organization
  }

  extend type Mutation {
    updateOrganization(name: String, tag: String, workingSchedule: JSON): Organization!
  }
`;
