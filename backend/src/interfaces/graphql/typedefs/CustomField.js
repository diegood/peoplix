import gql from 'graphql-tag';

export const CustomFieldSchema = gql`
type CustomFieldDefinition {
  id: ID!
  fieldName: String!
  fieldLabel: String!
  fieldType: String!
  fieldConfig: String!
  isRequired: Boolean!
  order: Int!
}

type CustomFieldValue {
  id: ID!
  fieldDefinitionId: String!
  fieldDefinition: CustomFieldDefinition!
  value: String!
}

  extend type Query {

  customFieldDefinitions: [CustomFieldDefinition!]!
  }

  extend type Mutation {

  
  createCustomFieldDefinition(fieldName: String!, fieldLabel: String!, fieldType: String!, fieldConfig: String, isRequired: Boolean!, order: Int!): CustomFieldDefinition!

  updateCustomFieldDefinition(id: ID!, fieldName: String, fieldLabel: String, fieldType: String, fieldConfig: String, isRequired: Boolean, order: Int): CustomFieldDefinition!

  deleteCustomFieldDefinition(id: ID!): Boolean!

  setCustomFieldValue(collaboratorId: ID!, fieldDefinitionId: ID!, value: String!): Collaborator!
  }

`;
