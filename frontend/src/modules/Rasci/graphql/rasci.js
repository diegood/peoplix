import gql from 'graphql-tag'

export const GET_RASCI_DATA = gql`
  query GetRasciData($projectId: ID!) {
    project(id: $projectId) {
      id
      responsibilities {
        id
        role
        allocationId
        workPackageId
        functionalRequirementId
        targetAllocationId
      }
      workPackages { id name }
      functionalRequirements { id title }
    }
  }
`

export const ADD_RESPONSIBILITY = gql`
  mutation AddResponsibility($projectId: ID!, $allocationId: ID!, $role: RasciRole!, $workPackageId: ID, $functionalRequirementId: ID, $targetAllocationId: ID) {
    addResponsibility(projectId: $projectId, allocationId: $allocationId, role: $role, workPackageId: $workPackageId, functionalRequirementId: $functionalRequirementId, targetAllocationId: $targetAllocationId) {
      id
    }
  }
`

export const REMOVE_RESPONSIBILITY = gql`
  mutation RemoveResponsibility($id: ID!) {
    removeResponsibility(id: $id)
  }
`
