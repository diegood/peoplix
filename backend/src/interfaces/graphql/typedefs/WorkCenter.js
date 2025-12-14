import gql from 'graphql-tag';

export const WorkCenterSchema = gql`
type WorkCenter {
    id: ID!
    name: String!
    regionCode: String
    countryCode: String!
    publicHolidayCalendars: [PublicHolidayCalendar!]!
  }

type PublicHolidayCalendar {
    id: ID!
    year: Int!
    holidays: [PublicHoliday!]!
  }

type PublicHoliday {
    date: String!
    localName: String
    name: String
    countryCode: String
  }

input PublicHolidayInput {
    date: String!
    localName: String
    name: String
    countryCode: String
  }

  extend type Query {

  workCenters: [WorkCenter!]!
  }

  extend type Mutation {

  
  importPublicHolidays(year: Int!, countryCode: String!, regionCode: String): [PublicHoliday!]!

  savePublicHolidayCalendar(workCenterId: ID!, year: Int!, holidays: [PublicHolidayInput!]!): PublicHolidayCalendar!

  
  createWorkCenter(name: String!, regionCode: String, countryCode: String!): WorkCenter!

  updateWorkCenter(id: ID!, name: String, regionCode: String, countryCode: String): WorkCenter!

  deleteWorkCenter(id: ID!): Boolean!
  }

`;
