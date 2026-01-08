import gql from 'graphql-tag'

export const CREATE_FUNCTIONAL_REQUIREMENT = gql`
  mutation CreateFunctionalRequirement(
    $projectId: String!
    $title: String!
    $description: String!
    $generalDescription: String
    $actors: String
    $preconditions: String
    $expectedInputs: String
    $detailedFlow: String
    $validations: String
    $expectedOutputs: String
    $systemMessages: String
    $mockupUrl: String
    $notes: String
  ) {
    createFunctionalRequirement(
      projectId: $projectId
      title: $title
      description: $description
      generalDescription: $generalDescription
      actors: $actors
      preconditions: $preconditions
      expectedInputs: $expectedInputs
      detailedFlow: $detailedFlow
      validations: $validations
      expectedOutputs: $expectedOutputs
      systemMessages: $systemMessages
      mockupUrl: $mockupUrl
      notes: $notes
    ) {
      id
    }
  }
`

export const UPDATE_FUNCTIONAL_REQUIREMENT = gql`
  mutation UpdateFunctionalRequirement(
    $id: String!
    $title: String
    $description: String
    $generalDescription: String
    $actors: String
    $preconditions: String
    $expectedInputs: String
    $detailedFlow: String
    $validations: String
    $expectedOutputs: String
    $systemMessages: String
    $mockupUrl: String
    $notes: String
    $status: RequirementStatus
  ) {
    updateFunctionalRequirement(
      id: $id
      title: $title
      description: $description
      generalDescription: $generalDescription
      actors: $actors
      preconditions: $preconditions
      expectedInputs: $expectedInputs
      detailedFlow: $detailedFlow
      validations: $validations
      expectedOutputs: $expectedOutputs
      systemMessages: $systemMessages
      mockupUrl: $mockupUrl
      notes: $notes
      status: $status
    ) {
      id
    }
  }
`

export const DELETE_FUNCTIONAL_REQUIREMENT = gql`
  mutation DeleteFunctionalRequirement($id: String!) {
    deleteFunctionalRequirement(id: $id) {
      id
    }
  }
`
