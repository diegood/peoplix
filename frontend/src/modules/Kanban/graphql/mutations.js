import gql from 'graphql-tag'
import { KANBAN_CARD_FRAGMENT } from './fragments'

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
            id
            firstName
            lastName
            avatar
         }
      }
      reactions {
        id
        emoji
      }
    }
  }
`

export const EDIT_CARD_COMMENT = gql`
  mutation EditCardComment($commentId: ID!, $content: String!) {
    editCardComment(commentId: $commentId, content: $content) {
      id
      content
      createdAt
      author {
         id
         collaborator {
            id
            firstName
            lastName
            avatar
         }
      }
      history {
        id
        content
        createdAt
        author {
             id
             collaborator {
                id
                firstName
                lastName
             }
        }
      }
    }
  }
`

export const DELETE_CARD_COMMENT = gql`
  mutation DeleteCardComment($commentId: ID!) {
     deleteCardComment(commentId: $commentId)
  }
`

export const ADD_REACTION = gql`
  mutation AddReaction($commentId: ID!, $emoji: String!) {
    addReaction(commentId: $commentId, emoji: $emoji) {
      id
      emoji
      user {
        id
        collaborator {
            id
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
