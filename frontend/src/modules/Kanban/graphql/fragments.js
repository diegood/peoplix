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
