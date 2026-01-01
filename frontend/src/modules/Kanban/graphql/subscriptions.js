import gql from 'graphql-tag'
import { KANBAN_CARD_FRAGMENT } from './fragments'

export const CARD_UPDATED_SUBSCRIPTION = gql`
  subscription CardUpdated($cardId: ID!) {
     cardUpdated(cardId: $cardId) {
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
