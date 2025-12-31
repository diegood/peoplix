import { prisma } from '../database/client.js'

export class PrismaKanbanRepository {
    async create(data) {
        return prisma.kanbanCard.create({ data })
    }

    async findById(id) {
        return prisma.kanbanCard.findUnique({
            where: { id },
            include: { 
                children: true, 
                timeline: true,
                collaborators: true,
                roles: true,
                comments: true,
                project: { include: { organization: true } }
            }
        })
    }

    async findByReadableId(readableId, projectTag, orgTag) {
        const where = { readableId, isDeleted: false }
        
        if (projectTag) {
             where.project = {
                 tag: projectTag,
                 ...(orgTag ? { organization: { tag: orgTag } } : {})
             }
        } else if (orgTag) {
             where.project = {
                 organization: { tag: orgTag }
             }
        }

        return prisma.kanbanCard.findFirst({
            where,
            include: { 
                children: true, 
                timeline: true,
                collaborators: true,
                roles: true,
                comments: true,
                project: { include: { organization: true } }
            }
        })
    }

     async findByProject(projectId, userId = null) {
          const where = {
              projectId: projectId,
              isDeleted: false
          }

          if (userId) {
              const user = await prisma.user.findUnique({ where: { id: userId }, include: { collaborator: true } })
              if (user?.collaborator) {
                  where.collaborators = {
                      some: { id: user.collaborator.id }
                  }
              }
          }

          return prisma.kanbanCard.findMany({
             where,
             include: {
                 children: true, 
                 timeline: true,
                 collaborators: true,
                 roles: true,
                 comments: true,
                 project: { include: { organization: true } }
             }
          })
     }
    
    async findMaxReadableId(projectPrefix) {
        const lastCard = await prisma.kanbanCard.findFirst({
            where: { readableId: { startsWith: projectPrefix } },
            orderBy: { createdAt: 'desc' }
        })
        return lastCard ? lastCard.readableId : null
    }

    async update(id, data) {
        return prisma.kanbanCard.update({
            where: { id },
            data,
            include: { collaborators: true }
        })
    }

    async updateStatus(id, status) {
        return prisma.kanbanCard.update({
            where: { id },
            data: { status }
        })
    }

    async softDelete(id) {
        return prisma.kanbanCard.update({
            where: { id },
            data: { isDeleted: true }
        })
    }

    async addComment(data) {
        return prisma.cardComment.create({ data })
    }

    async addEvent(data) {
        return prisma.cardEvent.create({ data })
    }
}
