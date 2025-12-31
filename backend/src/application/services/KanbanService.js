import { PrismaKanbanRepository } from '../../infrastructure/repositories/PrismaKanbanRepository.js'
import { prisma } from '../../infrastructure/database/client.js'

export class KanbanService {
    constructor(repository) {
        this.repository = repository || new PrismaKanbanRepository()
    }

    async createCardFromEstimation({ estimationId, projectId, projectTag }) {
        return this.createCardStructureFromEstimation({ estimationId, projectId, projectTag })
    }

    async createCardStructureFromTask({ taskId, projectId, projectTag }) {
        if(!projectTag) throw new Error('Project tag is required')
        if(!projectId) throw new Error('Project ID is required')
        
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { 
                estimations: {
                    include: { role: true }
                } 
            }
        })
        if (!task) throw new Error('Task not found')

        const prefix = projectTag
        const lastId = await this.repository.findMaxReadableId(prefix)
        let seq = 1
        if (lastId) {
            const parts = lastId.split('-')
            if (parts.length === 2) seq = parseInt(parts[1]) + 1
        }
        const readableId = `${prefix}-${seq}`

        const parentCard = await this.repository.create({
            projectId,
            readableId,
            title: task.name,
            description: task.description,
            status: 'todo',
        })
        await this.logEvent(parentCard.id, 'CREATED', 'Parent card created from task')
        let currentSeq = seq
        
        for (const est of task.estimations) {
            if (est.hours > 0) {
                currentSeq++
                const childId = `${prefix}-${currentSeq}`
                
                const childCard = await this.repository.create({
                    projectId,
                    readableId: childId,
                    title: `${parentCard.readableId} ${parentCard.title} + ${est.role?.name || 'Task Execution'}`,
                    description: `Estimation: ${est.hours}h`,
                    status: 'todo',
                    taskEstimationId: est.id,
                    parentCardId: parentCard.id,
                    estimatedStartDate: est.startDate,
                    estimatedEndDate: est.endDate,
                    risk: 'NONE'
                })
                
                if (est.collaboratorId) {
                    await prisma.kanbanCard.update({
                        where: { id: childCard.id },
                        data: {
                            collaborators: {
                                connect: { id: est.collaboratorId }
                            }
                        }
                    })
                }
            }
        }
        
        return parentCard
    }



    async moveCard(cardId, newStatus, userId) {
        const updates = { status: newStatus }
        const now = new Date()

        if (newStatus === 'in_progress') {
            updates.startDate = now
        } else if (newStatus === 'done') {
            updates.endDate = now
        }

        const card = await this.repository.update(cardId, updates)
        await this.logEvent(cardId, 'MOVED', `Moved to ${newStatus}`, userId)
        return card
    }

    async updateCard(cardId, data, userId) {
        const card = await this.repository.update(cardId, data)
        await this.logEvent(cardId, 'UPDATED', 'Card details updated', userId)
        return card
    }

    async addComment(cardId, content, authorId) {
        const comment = await this.repository.addComment({
            cardId,
            content,
            authorId
        })
        await this.logEvent(cardId, 'COMMENT_ADDED', 'Comment added', authorId)
        return comment
    }

    async deleteCard(cardId) {
        return this.repository.update(cardId, { isDeleted: true })
    }

    async addSubtask(parentCardId, title) {
        const parent = await this.repository.findById(parentCardId)
        if (!parent) throw new Error('Parent card not found')
        const prefix = parent.readableId.split('-')[0]
        const lastId = await this.repository.findMaxReadableId(prefix)
        let seq = 1
        if (lastId) {
             const parts = lastId.split('-')
             if (parts.length === 2) seq = parseInt(parts[1]) + 1
        }
        const readableId = `${prefix}-${seq}`
        
        return this.repository.create({
            projectId: parent.projectId,
            readableId,
            title,
            status: 'todo',
            parentCardId,
            risk: 'NONE'
        })
    }
    async logEvent(cardId, type, details, authorId) {
        return this.repository.addEvent({
            cardId,
            type,
            details,
            authorId
        })
    }

    async getGlobalBoard(userId, onlyMy = true) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { collaborator: true } })
        if (!user || !user.collaborator) return []
        
        const collaboratorId = user.collaborator.id
        
        const where = { isDeleted: false }

        if (onlyMy) {
            where.collaborators = {  some: { id: collaboratorId } }
        } else {
            where.project = { allocations: {  some: { collaboratorId: collaboratorId } } }
        }
        
        return prisma.kanbanCard.findMany({
            where,
            include: {
                collaborators: true,
                roles: true,
                children: true,
                project: { include: { organization: true } } 
            }
        })
    }
}
