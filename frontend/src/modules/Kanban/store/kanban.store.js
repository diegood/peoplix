import { defineStore } from 'pinia'
import { apolloClient } from '@/apollo'
import { GET_KANBAN_BOARD, GET_KANBAN_CARD, MOVE_CARD, CREATE_CARD_FROM_ESTIMATION, CREATE_CARD_FROM_TASK, DELETE_CARD, ADD_SUBTASK, UPDATE_CARD, ADD_CARD_COMMENT } from '../graphql/kanban'

export const useKanbanStore = defineStore('kanban', {
  state: () => ({
    cards: [],
    loading: false,
    error: null,
    statuses: ['todo', 'in_progress', 'review', 'done']
  }),

  actions: {
    async fetchBoard(idOrContext) {
      this.loading = true
      try {
        const variables = {}
        
        if (typeof idOrContext === 'string') {
            variables.projectId = idOrContext
        } else if (typeof idOrContext === 'object') {
            if (idOrContext.projectId) variables.projectId = idOrContext.projectId
            if (idOrContext.projectTag) variables.projectTag = idOrContext.projectTag
            if (idOrContext.orgTag) variables.orgTag = idOrContext.orgTag
            if (idOrContext.onlyMy !== undefined) variables.onlyMy = idOrContext.onlyMy
        }

        const { data } = await apolloClient.query({
          query: GET_KANBAN_BOARD,
          variables,
          fetchPolicy: 'network-only'
        })
        this.cards = data.kanbanBoard ? JSON.parse(JSON.stringify(data.kanbanBoard)) : []
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async fetchCard(idOrReadableId, context = {}) {
        try {
            const isReadableId = typeof idOrReadableId === 'string' && idOrReadableId.includes('-') && !idOrReadableId.match(/^[0-9a-f]{8}-/);
            const variables = isReadableId 
                ? { 
                    readableId: idOrReadableId, 
                    projectTag: context.projectTag,
                    orgTag: context.orgTag
                  } 
                : { id: idOrReadableId }
            
            const { data } = await apolloClient.query({
                query: GET_KANBAN_CARD,
                variables,
                fetchPolicy: 'network-only'
            })
            return data.kanbanCard ? JSON.parse(JSON.stringify(data.kanbanCard)) : null
        } catch (e) {
            console.error('Failed to fetch card detail', e)
            return null
        }
    },

    async createCard(estimationId, projectId) {
      try {
        const { data } = await apolloClient.mutate({
          mutation: CREATE_CARD_FROM_ESTIMATION,
          variables: { estimationId, projectId }
        })
        const newCard = data.createCardFromEstimation
        if (newCard) {
            this.cards.push(JSON.parse(JSON.stringify(newCard)))
        }
        return newCard
      } catch (err) {
        console.error(err)
        throw err
      }
    },

    async createCardStructure(taskId, projectId) {
        try {
            const { data } = await apolloClient.mutate({
                mutation: CREATE_CARD_FROM_TASK, 
                variables: { taskId, projectId }
            })
            const newCard = data.createCardFromTask
            if (newCard) {
                this.cards.push(JSON.parse(JSON.stringify(newCard)))
            }
            return newCard
        } catch (err) {
            console.error(err)
            throw err
        }
    },

    async deleteCard(cardId) {
        try {
            this.cards = this.cards.filter(c => c.id !== cardId)
            
            await apolloClient.mutate({
                mutation: DELETE_CARD,
                variables: { cardId }
            })
        } catch(e) {
            console.error(e)
        }
    },

    async addSubtask(parentCardId, title) {
        try {
             const { data } = await apolloClient.mutate({
                 mutation: ADD_SUBTASK,
                 variables: { parentCardId, title }
             })
             const newSubtask = data.addSubtask
             
             const parentIndex = this.cards.findIndex(c => c.id === parentCardId)
             if (parentIndex !== -1) {
                 const parent = this.cards[parentIndex]
                 const newChildren = parent.children ? [...parent.children] : []
                 newChildren.push(JSON.parse(JSON.stringify(newSubtask)))
                 
                 this.cards[parentIndex] = { ...parent, children: newChildren }
             }
             return newSubtask
        } catch(e) {
            console.error(e)
            throw e
        }
    },

    async moveCard(cardId, newStatus) {
      const card = this.cards.find(c => c.id === cardId)
      const oldStatus = card ? card.status : null
      
      if (card) { card.status = newStatus  }

      try {
        await apolloClient.mutate({
          mutation: MOVE_CARD,
          variables: { cardId, status: newStatus }
        })
      } catch (err) {
        if (card && oldStatus) card.status = oldStatus
        console.error('Failed to move card', err)
        throw err
      }
    },

    async updateCard(cardId, input) {
        try {
            const { data } = await apolloClient.mutate({
                mutation: UPDATE_CARD,
                variables: { cardId, input }
            })
            const updatedCard = data.updateCard
            
            const index = this.cards.findIndex(c => c.id === cardId)
            if (index !== -1) {
                this.cards[index] = JSON.parse(JSON.stringify(updatedCard))
            }
            return updatedCard
        } catch (e) {
            console.error('Failed to update card', e)
            throw e
        }
    },

    async addComment(cardId, content) {
        try {
             const { data } = await apolloClient.mutate({
                 mutation: ADD_CARD_COMMENT,
                 variables: { cardId, content }
             })
             const newComment = data.addCardComment
             
             const index = this.cards.findIndex(c => c.id === cardId)
             if (index !== -1) {
                 const card = this.cards[index]
                 const comments = card.comments ? [...card.comments, newComment] : [newComment]
                 this.cards[index] = { ...card, comments }
             }
             return newComment
        } catch(e) {
            console.error('Failed to add comment', e)
            throw e
        }
    }
  }
})
