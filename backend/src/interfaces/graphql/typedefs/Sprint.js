import gql from 'graphql-tag';

export const SprintSchema = gql`
type Sprint {
  id: ID!
  name: String!
  startDate: String!
  endDate: String!
}

`;
