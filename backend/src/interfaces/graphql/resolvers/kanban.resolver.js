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
      return service.moveCard(cardId, status, userId)
    },
    
    updateCard: async (_, { cardId, input }, context) => {
      const userId = context.user?.userId
      return service.updateCard(cardId, input, userId)
    },
    
    addCardComment: async (_, { cardId, content }, context) => {
        const userId = context.user?.userId
        return service.addComment(cardId, content, userId)
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
         return prisma.cardComment.findMany({ where: { cardId: parent.id } })
     },
     timeline: async (parent) => {
         if (parent.timeline) return parent.timeline
         return prisma.cardEvent.findMany({ where: { cardId: parent.id } })
     },
     collaborators: async (parent) => {
         if (parent.collaborators) return parent.collaborators
         const card = await prisma.kanbanCard.findUnique({ where: { id: parent.id }, include: { collaborators: true } })
         return card?.collaborators || []
     },
     roles: async (parent) => {
         if (parent.roles) return parent.roles
         const card = await prisma.kanbanCard.findUnique({ where: { id: parent.id }, include: { roles: true } })
         return card?.roles || []
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
      }
  },

  CardEvent: {
      author: async (parent) => {
          if(!parent.authorId) return null
          return prisma.user.findUnique({ where: { id: parent.authorId }, include: { collaborator: true } })
      }
  }
}
