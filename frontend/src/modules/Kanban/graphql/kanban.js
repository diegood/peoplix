import gql from 'graphql-tag'

export const KANBAN_CARD_FRAGMENT = gql`
  fragment KanbanCardParts on KanbanCard {
    id
    readableId
    title
    description
    status
    risk
    startDate
    endDate
    estimatedStartDate

    estimatedEndDate
    project {
      id
      tag
      name
      organization {
        tag
      }
    }
    collaborators {
      id
      firstName
      lastName
      avatar
    }
    roles {
        id
        name
    }
    children {
      id
      title
      status
      readableId
      description
      risk
      startDate
      endDate
      estimatedStartDate
      estimatedEndDate
      collaborators {
        id
        firstName
        lastName
        avatar
      }
      roles {
        id
        name
      }
      breadcrumbs {
        id
        title
        readableId
        status
        description
        risk
        startDate
        endDate
        estimatedStartDate
        estimatedEndDate
        parentCard {
          id
          readableId
        }
        collaborators {
            id
            firstName
            avatar
        }
        children {
            id
            title
            status
            readableId
        }
      }
    }
    parentCard {
      id
      title
      readableId
    }
    breadcrumbs {
      id
      title
      readableId
      status
      description
      risk
      startDate
      endDate
      estimatedStartDate
      estimatedEndDate
      parentCard {
        id
        readableId
      }
      collaborators {
        id
        firstName
        avatar
      }
      children {
        id
        title
        status
        readableId
      }
    }
    comments {
      id
    }
    taskEstimationId
  }
`

export const GET_KANBAN_BOARD = gql`
  query GetKanbanBoard($projectId: ID, $projectTag: String, $orgTag: String, $onlyMy: Boolean) {
    kanbanBoard(projectId: $projectId, projectTag: $projectTag, orgTag: $orgTag, onlyMy: $onlyMy) {
      ...KanbanCardParts
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`

export const GET_KANBAN_CARD = gql`
  query GetKanbanCard($id: ID, $readableId: String, $projectTag: String, $orgTag: String) {
    kanbanCard(id: $id, readableId: $readableId, projectTag: $projectTag, orgTag: $orgTag) {
      ...KanbanCardParts
      comments {
        id
        content
        createdAt
        author {
          id
          collaborator {
            firstName
            lastName
            avatar
          }
        }
      }
      timeline {
        id
        type
        details
        createdAt
            author {
          id
          collaborator {
            firstName
            lastName
          }
        }
      }
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`

export const CREATE_CARD_FROM_ESTIMATION = gql`
  mutation CreateCardFromEstimation($estimationId: ID!, $projectId: ID!) {
    createCardFromEstimation(estimationId: $estimationId, projectId: $projectId) {
       ...KanbanCardParts
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`

export const CREATE_CARD_FROM_TASK = gql`
  mutation CreateCardFromTask($taskId: ID!, $projectId: ID!) {
    createCardFromTask(taskId: $taskId, projectId: $projectId) {
       ...KanbanCardParts
       children {
         id
         title
         status
         readableId
         collaborators {
            id
            firstName
            lastName
         }
       }
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`

export const MOVE_CARD = gql`
  mutation MoveCard($cardId: ID!, $status: String!) {
    moveCard(cardId: $cardId, status: $status) {
      id
      status
    }
  }
`

export const ADD_CARD_COMMENT = gql`
  mutation AddCardComment($cardId: ID!, $content: String!) {
    addCardComment(cardId: $cardId, content: $content) {
      id
      content
      createdAt
      author {
         id
         collaborator {
            firstName
            lastName
            avatar
         }
      }
    }
  }
`

export const DELETE_CARD = gql`
  mutation DeleteCard($cardId: ID!) {
     deleteCard(cardId: $cardId)
  }
`

export const ADD_SUBTASK = gql`
  mutation AddSubtask($parentCardId: ID!, $title: String!) {
     addSubtask(parentCardId: $parentCardId, title: $title) {
        id
        title
        status
        readableId
     }
  }
`

export const UPDATE_CARD = gql`
  mutation UpdateCard($cardId: ID!, $input: UpdateCardInput!) {
    updateCard(cardId: $cardId, input: $input) {
      ...KanbanCardParts
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`
