import { KanbanService } from '../../../application/services/KanbanService.js'
import { prisma } from '../../../infrastructure/database/client.js'

const service = new KanbanService()

async function getProjectTag(projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    return project?.name?.slice(0, 3).toUpperCase() || 'TAG'
}

export default {
  Query: {
    kanbanBoard: async (_, { projectId, projectTag, orgTag, onlyMy }, context) => {
      let targetProjectId = projectId

      if (!targetProjectId && projectTag && orgTag) {
          const project = await prisma.project.findFirst({
              where: {
                  tag: projectTag,
                  organization: { tag: orgTag }
              }
          })
          if (project) {
              targetProjectId = project.id
          }
      }

      const userId = context.user?.userId
      
      if (targetProjectId) {
          return service.repository.findByProject(targetProjectId, onlyMy ? userId : null)
      } else {
          if (!userId) throw new Error('Unauthorized')
          const filterMine = onlyMy !== false
          return service.getGlobalBoard(userId, filterMine)
      }
    },
    kanbanCard: async (_, { id, readableId, projectTag, orgTag }) => {
      if (id) return service.repository.findById(id)
      if (readableId) return service.repository.findByReadableId(readableId, projectTag, orgTag)
      return null
    }
  },

  Subscription: {
    cardUpdated: {
      subscribe: async (_, { cardId }, { pubsub }) => {
        return pubsub.subscribe(`CARD_UPDATED_${cardId}`)
      }
    }
  },

  
  Mutation: {
    createCardFromEstimation: async (_, { estimationId, projectId }) => {
       const tag = await getProjectTag(projectId)
       return service.createCardFromEstimation({ estimationId, projectId, projectTag: tag })
    },

    createCardFromTask: async (_, { taskId, projectId }) => {
        const tag = await getProjectTag(projectId)
        return service.createCardStructureFromTask({ taskId, projectId, projectTag: tag })
    },
    
    moveCard: async (_, { cardId, status }, context) => {
      const userId = context.user?.userId
      const card = await service.moveCard(cardId, status, userId)
      context.pubsub.emitter.emit({
          topic: `CARD_UPDATED_${cardId}`,
          payload: { cardUpdated: card }
      })
      return card
    },
    
    updateCard: async (_, { cardId, input }, context) => {
      const userId = context.user?.userId
      const card = await service.updateCard(cardId, input, userId)
      context.pubsub.emitter.emit({
          topic: `CARD_UPDATED_${cardId}`,
          payload: { cardUpdated: card }
      })
      return card
    },
    
    addCardComment: async (_, { cardId, content }, context) => {
        const userId = context.user?.userId
        const comment = await service.addComment(cardId, content, userId)
        
        const card = await service.repository.findById(cardId)
        context.pubsub.emitter.emit({
            topic: `CARD_UPDATED_${cardId}`,
            payload: { cardUpdated: card }
        })
        
        return comment
    },

    editCardComment: async (_, { commentId, content }, context) => {
        const userId = context.user?.userId
        if (!userId) throw new Error('Unauthorized')

        const comment = await prisma.cardComment.findUnique({ 
            where: { id: commentId },
            include: { author: true } 
        })
        if (!comment) throw new Error('Comment not found')

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { collaborator: true }
        })
        
        const isAdmin = user?.collaborator?.systemRole === 1
        const isAuthor = comment.authorId === userId

        if (!isAuthor && !isAdmin) {
            throw new Error('Forbidden: Only author or admin can edit')
        }

        await prisma.cardCommentHistory.create({
            data: {
                content: comment.content,
                commentId: comment.id,
                authorId: comment.authorId
            }
        })

        const updatedComment = await prisma.cardComment.update({
            where: { id: commentId },
            data: { content }
        })

        await prisma.cardEvent.create({
            data: {
                type: 'COMMENT_EDITED',
                details: content,
                cardId: comment.cardId,
                authorId: userId
            }
        })

        const card = await service.repository.findById(comment.cardId)
        context.pubsub.emitter.emit({
            topic: `CARD_UPDATED_${comment.cardId}`,
            payload: { cardUpdated: card }
        })

        return updatedComment
    },

    deleteCardComment: async (_, { commentId }, context) => {
        const userId = context.user?.userId
        if (!userId) throw new Error('Unauthorized')

        const comment = await prisma.cardComment.findUnique({
            where: { id: commentId },
            include: { author: true }
        })
        if (!comment) throw new Error('Comment not found')

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { collaborator: true }
        })

        const isAdmin = user?.collaborator?.systemRole === 1
        const isAuthor = comment.authorId === userId

        if (!isAuthor && !isAdmin) {
             throw new Error('Forbidden')
        }

        // Soft delete
        await prisma.cardComment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        })

        // Create timeline event
        await prisma.cardEvent.create({
            data: {
                type: 'COMMENT_DELETED',
                details: comment.content,
                cardId: comment.cardId,
                authorId: userId
            }
        })

        // Broadcast update
        const card = await service.repository.findById(comment.cardId)
        context.pubsub.emitter.emit({
            topic: `CARD_UPDATED_${comment.cardId}`,
            payload: { cardUpdated: card }
        })

        return true
    },

    addReaction: async (_, { commentId, emoji }, context) => {
        const userId = context.user?.userId
        if (!userId) throw new Error('Unauthorized')

        const existing = await prisma.cardCommentReaction.findUnique({
            where: {
                commentId_userId_emoji: {
                    commentId,
                    userId,
                    emoji
                }
            }
        })

        let reaction;
        if (existing) {
             const deleted = await prisma.cardCommentReaction.delete({ 
                where: { id: existing.id },
                include: { user: { include: { collaborator: true } } }
            })
            reaction = deleted
        } else {
            reaction = await prisma.cardCommentReaction.create({
                data: {
                    commentId,
                    userId,
                    emoji
                },
                include: { user: { include: { collaborator: true } } }
            })
        }

        const comment = await prisma.cardComment.findUnique({ where: { id: commentId } })
        if (comment) {
            const card = await service.repository.findById(comment.cardId)
            context.pubsub.emitter.emit({
                topic: `CARD_UPDATED_${comment.cardId}`,
                payload: { cardUpdated: card }
            })
        }

        return reaction
    },

    deleteCard: async (_, { cardId }) => {
        await service.deleteCard(cardId)
        return true
    },

    addSubtask: async (_, { parentCardId, title }) => {
        return service.addSubtask(parentCardId, title)
    }
  },
  
  KanbanCard: {
     children: async (parent) => {
         if (parent.children) return parent.children
         return prisma.kanbanCard.findMany({ where: { parentCardId: parent.id } })
     },
     comments: async (parent) => {
         if (parent.comments) return parent.comments
         return prisma.cardComment.findMany({ where: { cardId: parent.id, isDeleted: false } })
     },
     timeline: async (parent) => {
         if (parent.timeline) return parent.timeline
         return prisma.cardEvent.findMany({ where: { cardId: parent.id } })
     },
     collaborators: async (parent) => {
         if (parent.collaborators) return parent.collaborators
         return prisma.kanbanCard.findUnique({ where: { id: parent.id } }).collaborators() || []
     },
     roles: async (parent) => {
         if (parent.roles) return parent.roles
         return prisma.kanbanCard.findUnique({ where: { id: parent.id } }).roles() || []
     },
     breadcrumbs: async (parent) => {
         let path = []
         let currentId = parent.parentCardId
         
         while (currentId) {
            const parentCard = await prisma.kanbanCard.findUnique({ where: { id: currentId } })
            if (!parentCard) break
            path.unshift(parentCard)
            currentId = parentCard.parentCardId
         }
         return path
     }
  },
  
  CardComment: {
      author: async (parent) => {
          if(!parent.authorId) return null
          return prisma.user.findUnique({ where: { id: parent.authorId }, include: { collaborator: true } })
      },
      reactions: async (parent) => {
          return prisma.cardCommentReaction.findMany({ where: { commentId: parent.id }, include: { user: { include: { collaborator: true } } } })
      },
      history: async (parent) => {
          return prisma.cardCommentHistory.findMany({ 
              where: { commentId: parent.id }, 
              include: { author: { include: { collaborator: true } } },
              orderBy: { createdAt: 'desc' }
          })
      }
  },

  CardEvent: {
      author: async (parent) => {
          if(!parent.authorId) return null
          return prisma.user.findUnique({ where: { id: parent.authorId }, include: { collaborator: true } })
      }
  }
}
