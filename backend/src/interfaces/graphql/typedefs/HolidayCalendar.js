import gql from 'graphql-tag';

export const HolidayCalendarSchema = gql`
type HolidayCalendar {
  id: ID!
  year: Int!
  holidays: [String!]!
  lastModified: String!
  collaboratorId: String!
}

  extend type Mutation {

  
  updateHolidayCalendar(collaboratorId: ID!, year: Int!, holidays: [String!]!): HolidayCalendar!
  }

`;
