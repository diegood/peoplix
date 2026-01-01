
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KanbanService } from '../../../src/application/services/KanbanService.js'
import { prisma } from '../../../src/infrastructure/database/client.js'

// Mock Prisma Client since Service uses it directly in some methods (like createCardStructureFromTask)
vi.mock('../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    task: { findUnique: vi.fn() },
    kanbanCard: { update: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn() }
  }
}))

describe('KanbanService', () => {
    let service
    let mockRepository

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            update: vi.fn(),
            addComment: vi.fn(),
            addEvent: vi.fn(),
            create: vi.fn(),
            findMaxReadableId: vi.fn()
        }
        service = new KanbanService(mockRepository)
        vi.clearAllMocks()
    })

    describe('createCardStructureFromTask', () => {
        it('should throw if missing projection info', async () => {
            await expect(service.createCardStructureFromTask({ taskId: 't1' })).rejects.toThrow('Project tag is required')
            await expect(service.createCardStructureFromTask({ taskId: 't1', projectTag: 'TAG' })).rejects.toThrow('Project ID is required')
        })

        it('should throw if task not found', async () => {
            prisma.task.findUnique.mockResolvedValue(null)
            await expect(service.createCardStructureFromTask({ taskId: 't1', projectId: 'p1', projectTag: 'TAG' }))
                .rejects.toThrow('Task not found')
        })

        it('should create parent and child cards from task estimations', async () => {
            const taskId = 't1'
            const projectId = 'p1'
            const projectTag = 'TAG'
            const task = {
                id: taskId,
                name: 'Task Name',
                description: 'Desc',
                estimations: [
                    { id: 'est1', hours: 5, role: { name: 'Dev' }, startDate: '2023-01-01', endDate: '2023-01-05', collaboratorId: 'col1' },
                    { id: 'est2', hours: 0 } // Should be skipped
                ]
            }

            prisma.task.findUnique.mockResolvedValue(task)
            mockRepository.findMaxReadableId.mockResolvedValue('TAG-10') // Next should be 11
            mockRepository.create.mockImplementation((data) => Promise.resolve({ ...data, id: 'created_id_' + data.readableId }))
            
            await service.createCardStructureFromTask({ taskId, projectId, projectTag })

            // Verify Parent Creation
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                readableId: 'TAG-11',
                title: 'Task Name',
                status: 'todo',
                projectId
            }))
            
            // Verify Child Creation (only est1)
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                readableId: 'TAG-12',
                parentCardId: 'created_id_TAG-11',
                risk: 'NONE',
                taskEstimationId: 'est1'
            }))
            
            // Verify Collaborator Connection
            expect(prisma.kanbanCard.update).toHaveBeenCalledWith({
                where: { id: 'created_id_TAG-12' },
                data: { collaborators: { connect: { id: 'col1' } } }
            })
        })
    })

    describe('deleteCard', () => {
        it('should soft delete card', async () => {
            const cardId = 'card-1'
            mockRepository.update.mockResolvedValue({ id: cardId, isDeleted: true })
            
            await service.deleteCard(cardId)
            
            expect(mockRepository.update).toHaveBeenCalledWith(cardId, { isDeleted: true })
        })
    })

    describe('addSubtask', () => {
        it('should throw if parent not found', async () => {
            mockRepository.findById.mockResolvedValue(null)
            await expect(service.addSubtask('parent-1', 'Subtask')).rejects.toThrow('Parent card not found')
        })

        it('should create subtask with generated ID', async () => {
            const parent = { id: 'p-1', readableId: 'TAG-10', projectId: 'proj-1' }
            mockRepository.findById.mockResolvedValue(parent)
            mockRepository.findMaxReadableId.mockResolvedValue('TAG-20')
            
            await service.addSubtask('p-1', 'New Subtask')
            
            expect(mockRepository.create).toHaveBeenCalledWith({
                projectId: 'proj-1',
                readableId: 'TAG-21',
                title: 'New Subtask',
                status: 'todo',
                parentCardId: 'p-1',
                risk: 'NONE'
            })
        })
    })

    describe('updateCard', () => {
        it('should log detailed changes when title and description change', async () => {
            const cardId = 'card-1'
            const userId = 'user-1'
            const oldCard = { id: cardId, title: 'Old Title', description: 'Old Desc', risk: 'NONE' }
            const updates = { title: 'New Title', description: 'New Desc' }
            const newCard = { ...oldCard, ...updates }

            mockRepository.findById.mockResolvedValue(oldCard)
            mockRepository.update.mockResolvedValue(newCard)

            await service.updateCard(cardId, updates, userId)

            expect(mockRepository.update).toHaveBeenCalledWith(cardId, updates)
            expect(mockRepository.addEvent).toHaveBeenCalledWith({
                cardId,
                type: 'UPDATED',
                details: 'Título actualizado, Descripción actualizada',
                authorId: userId
            })
        })

        it('should log risk change', async () => {
            const cardId = 'card-1'
            const userId = 'user-1'
            const oldCard = { id: cardId, title: 'Title', risk: 'NONE' }
            const updates = { risk: 'HIGH' }
            
            mockRepository.findById.mockResolvedValue(oldCard)
            mockRepository.update.mockResolvedValue({ ...oldCard, ...updates })

            await service.updateCard(cardId, updates, userId)

            expect(mockRepository.addEvent).toHaveBeenCalledWith({
                cardId,
                type: 'UPDATED',
                details: 'Riesgo cambiado a HIGH',
                authorId: userId
            })
        })
        
        it('should not log event if no relevant fields changed', async () => {
             const cardId = 'card-1'
             const userId = 'user-1'
             const oldCard = { id: cardId, title: 'Title' }
             const updates = { otherField: 'val' }
             
             mockRepository.findById.mockResolvedValue(oldCard)
             mockRepository.update.mockResolvedValue(oldCard) // Assume update happens but we check diffs on known fields
             
             await service.updateCard(cardId, updates, userId)
             
             expect(mockRepository.addEvent).not.toHaveBeenCalled()
        })
    })

    describe('addComment', () => {
        it('should truncate long comments for event details', async () => {
            const cardId = 'card-1'
            const userId = 'user-1'
            const longContent = 'a'.repeat(300)
            const expectedSummary = 'a'.repeat(200) + '...'
            
            mockRepository.addComment.mockResolvedValue({ id: 'c-1', content: longContent })
            
            await service.addComment(cardId, longContent, userId)
            
            expect(mockRepository.addComment).toHaveBeenCalledWith({ cardId, content: longContent, authorId: userId })
            expect(mockRepository.addEvent).toHaveBeenCalledWith({
                cardId,
                type: 'COMMENT_ADDED',
                details: expectedSummary,
                authorId: userId
            })
        })
    })
    
    describe('moveCard', () => {
        it('should move card and log event', async () => {
            const cardId = 'card-1'
            const userId = 'user-1'
            const newStatus = 'in_progress'
            
            mockRepository.update.mockResolvedValue({ id: cardId, status: newStatus })
            
            await service.moveCard(cardId, newStatus, userId)
            
            expect(mockRepository.update).toHaveBeenCalledWith(cardId, expect.objectContaining({ 
                status: newStatus,
                startDate: expect.any(Date) 
            }))
            expect(mockRepository.addEvent).toHaveBeenCalledWith({
                cardId,
                type: 'MOVED',
                details: `Moved to ${newStatus}`,
                authorId: userId
            })
        })
    })

    describe('getGlobalBoard', () => {
        it('should return empty if user or collaborator not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null)
            const res = await service.getGlobalBoard('u1')
            expect(res).toEqual([])
        })

        it('should filter by collaborator if onlyMy is true', async () => {
            const user = { id: 'u1', collaborator: { id: 'col1' } }
            prisma.user.findUnique.mockResolvedValue(user)
            prisma.kanbanCard.findMany.mockResolvedValue([])

            await service.getGlobalBoard('u1', true)

            expect(prisma.kanbanCard.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    isDeleted: false,
                    collaborators: { some: { id: 'col1' } }
                }
            }))
        })

        it('should filter by project allocations if onlyMy is false', async () => {
            const user = { id: 'u1', collaborator: { id: 'col1' } }
            prisma.user.findUnique.mockResolvedValue(user)
            prisma.kanbanCard.findMany.mockResolvedValue([])

            await service.getGlobalBoard('u1', false)

            expect(prisma.kanbanCard.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    isDeleted: false,
                    project: { allocations: { some: { collaboratorId: 'col1' } } }
                }
            }))
        })
    })
})
