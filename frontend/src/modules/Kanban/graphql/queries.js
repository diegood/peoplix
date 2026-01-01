import gql from 'graphql-tag'
import { KANBAN_CARD_FRAGMENT } from './fragments'

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
            id
            firstName
            lastName
            avatar
          }
        }
        reactions {
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
                    avatar
                }
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
            id
            firstName
            lastName
          }
        }
      }
    }
  }
  ${KANBAN_CARD_FRAGMENT}
`
