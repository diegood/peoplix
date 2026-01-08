import gql from 'graphql-tag'

export const GET_FUNCTIONAL_REQUIREMENTS = gql`
  query GetFunctionalRequirements($projectId: String!, $status: RequirementStatus) {
    functionalRequirements(projectId: $projectId, status: $status) {
      id
      title
      description
      status
      version
      createdAt
      updatedAt
      analyst {
        id
        email
        collaborator {
          id
          firstName
          lastName
        }
      }
      history {
        changedBy {
          id
          email
          collaborator {
            id
            firstName
            lastName
          }
        }
      }
      workPackages {
        id
      }
    }
  }
`

export const GET_FUNCTIONAL_REQUIREMENT = gql`
  query GetFunctionalRequirement($id: String!) {
    functionalRequirement(id: $id) {
      id
      title
      description
      generalDescription
      actors
      preconditions
      expectedInputs
      detailedFlow
      validations
      expectedOutputs
      systemMessages
      mockupUrl
      notes
      status
      version
      createdAt
      updatedAt
      analyst {
        id
        email
        collaborator {
          id
          firstName
          lastName
        }
      }
      history {
        changedBy {
          id
          email
          collaborator {
            id
            firstName
            lastName
          }
        }
      }
      workPackages {
        id
      }
    }
  }
`
