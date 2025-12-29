import gql from 'graphql-tag';

export const OrganizationSchema = gql`
  type Organization {
    id: ID!
    name: String!
    workingSchedule: JSON
  }

  extend type Query {
    organization: Organization
  }

  extend type Mutation {
    updateOrganization(workingSchedule: JSON): Organization!
  }
`;
