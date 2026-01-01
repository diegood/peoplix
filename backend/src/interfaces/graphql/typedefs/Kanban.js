import gql from 'graphql-tag';

export const KanbanSchema = gql`
  type KanbanCard {
    id: ID!
    readableId: String
    title: String
    description: String
    status: String
    risk: String
    
    startDate: String
    endDate: String
    estimatedStartDate: String
    estimatedEndDate: String
    estimatedHours: Float
    
    createdAt: String
    updatedAt: String
    
    children: [KanbanCard]
    parentCard: KanbanCard
    comments: [CardComment]
    timeline: [CardEvent]
    
    collaborators: [Collaborator]
    roles: [Role]
    breadcrumbs: [KanbanCard]
    
    taskEstimationId: String
    project: Project
  }

  type CardComment {
    id: ID!
    content: String!
    author: User
    createdAt: String
    updatedAt: String
    isDeleted: Boolean
    reactions: [CardCommentReaction]
    history: [CardCommentHistory]
  }

  type CardCommentHistory {
    id: ID!
    content: String!
    createdAt: String!
    author: User
  }

  type CardCommentReaction {
    id: ID!
    emoji: String!
    user: User
    createdAt: String
  }

  type CardEvent {
    id: ID!
    type: String!
    details: String
    author: User
    createdAt: String
  }

  extend type Query {
    kanbanBoard(projectId: ID, projectTag: String, orgTag: String, onlyMy: Boolean): [KanbanCard]
    kanbanCard(id: ID, readableId: String, projectTag: String, orgTag: String): KanbanCard
  }

  extend type Subscription {
    cardUpdated(cardId: ID!): KanbanCard
  }

  extend type Mutation {
    createCardFromEstimation(estimationId: ID!, projectId: ID!): KanbanCard
    createCardFromTask(taskId: ID!, projectId: ID!): KanbanCard
    moveCard(cardId: ID!, status: String!): KanbanCard
    
    updateCard(cardId: ID!, input: UpdateCardInput!): KanbanCard
    
    addCardComment(cardId: ID!, content: String!): CardComment
    editCardComment(commentId: ID!, content: String!): CardComment
    deleteCardComment(commentId: ID!): Boolean
    addReaction(commentId: ID!, emoji: String!): CardCommentReaction
    deleteCard(cardId: ID!): Boolean
    addSubtask(parentCardId: ID!, title: String!): KanbanCard
  }

  type User {
    id: ID!
    email: String
    collaborator: Collaborator
  }

  input UpdateCardInput {
    title: String
    description: String
    risk: String
    startDate: String
    endDate: String
    estimatedHours: Float
    status: String
  }
`;
