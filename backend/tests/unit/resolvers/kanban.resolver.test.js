
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '../../../src/infrastructure/database/client.js'
import resolver, { service } from '../../../src/interfaces/graphql/resolvers/kanban.resolver.js'
import { KanbanService } from '../../../src/application/services/KanbanService.js'

vi.mock('../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    task: { findUnique: vi.fn() },
    kanbanCard: { update: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    project: { findFirst: vi.fn(), findUnique: vi.fn() },
    cardComment: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    cardEvent: { create: vi.fn(), findMany: vi.fn() },
    cardCommentHistory: { create: vi.fn(), findMany: vi.fn() },
    cardCommentReaction: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() }
  }
}))

vi.mock('../../../src/application/services/KanbanService.js', () => {
  const MockKanbanService = vi.fn()
  MockKanbanService.prototype.repository = { 
      findById: vi.fn().mockResolvedValue({ id: 'card-1' }),
      findUnique: vi.fn(),
      findByProject: vi.fn(),
      findByReadableId: vi.fn()
  }
  MockKanbanService.prototype.addComment = vi.fn().mockResolvedValue({})
  MockKanbanService.prototype.moveCard = vi.fn().mockResolvedValue({})
  MockKanbanService.prototype.updateCard = vi.fn().mockResolvedValue({})
  MockKanbanService.prototype.deleteCard = vi.fn().mockResolvedValue(true)
  MockKanbanService.prototype.createCardFromEstimation = vi.fn().mockResolvedValue({ id: 'c-1' })
  MockKanbanService.prototype.createCardStructureFromTask = vi.fn().mockResolvedValue({ id: 'c-1' })
  MockKanbanService.prototype.addSubtask = vi.fn().mockResolvedValue({ id: 'sub-1' })
  MockKanbanService.prototype.getGlobalBoard = vi.fn().mockResolvedValue([])
  return { KanbanService: MockKanbanService }
})

describe('KanbanResolver', () => {
    let context

    beforeEach(() => {
        vi.clearAllMocks()
        context = {
            user: { userId: 'user-1' },
            pubsub: {
                publish: vi.fn(),
                subscribe: vi.fn(),
                emitter: {
                    emit: vi.fn()
                }
            }
        }
    })

    describe('Query', () => {
        describe('kanbanBoard', () => {
            it('should fetch global board for user', async () => {
                 const mockBoard = [{ id: 'card-1' }]
                 vi.spyOn(service.repository, 'findUnique').mockResolvedValue(null)
                 vi.spyOn(service, 'getGlobalBoard').mockResolvedValue(mockBoard)
                 
                 const result = await resolver.Query.kanbanBoard(null, {}, context)
                 expect(service.getGlobalBoard).toHaveBeenCalledWith('user-1', true)
                 expect(result).toBe(mockBoard)
            })

            it('should fetch board by project tag', async () => {
                 const project = { id: 'p-1' }
                 prisma.project.findFirst.mockResolvedValue(project)
                 vi.spyOn(service.repository, 'findByProject').mockResolvedValue([{ id: 'c-1' }])

                 await resolver.Query.kanbanBoard(null, { projectTag: 'TAG', orgTag: 'ORG' }, context)
                 
                 expect(prisma.project.findFirst).toHaveBeenCalledWith({ where: { tag: 'TAG', organization: { tag: 'ORG' } } })
                 expect(service.repository.findByProject).toHaveBeenCalledWith('p-1', null)
            })
            
             it('should throw Unauthorized if no project and no user', async () => {
                await expect(resolver.Query.kanbanBoard(null, {}, {})).rejects.toThrow('Unauthorized')
            })
        })

        describe('kanbanCard', () => {
            it('should find by id', async () => {
                vi.spyOn(service.repository, 'findById').mockResolvedValue({ id: 'c-1' })
                await resolver.Query.kanbanCard(null, { id: 'c-1' })
                expect(service.repository.findById).toHaveBeenCalledWith('c-1')
            })

            it('should find by readable id', async () => {
                vi.spyOn(service.repository, 'findByReadableId').mockResolvedValue({ id: 'c-1' })
                await resolver.Query.kanbanCard(null, { readableId: 'TAG-1', projectTag: 'TAG', orgTag: 'ORG' })
                expect(service.repository.findByReadableId).toHaveBeenCalledWith('TAG-1', 'TAG', 'ORG')
            })

            it('should return null if no args', async () => {
                const res = await resolver.Query.kanbanCard(null, {})
                expect(res).toBeNull()
            })
        })
    })
    
    describe('Mutation.Basics', () => {
        it('createCardFromEstimation', async () => {
            prisma.project.findUnique.mockResolvedValue({ name: 'Tag Project' })
            vi.spyOn(service, 'createCardFromEstimation').mockResolvedValue({ id: 'c-1' })
            
            await resolver.Mutation.createCardFromEstimation(null, { estimationId: 'e-1', projectId: 'p-1' })
            expect(service.createCardFromEstimation).toHaveBeenCalled()
        })
        
        it('moveCard', async () => {
            const cardId = 'c-1'
            const status = 'done'
            vi.spyOn(service, 'moveCard').mockResolvedValue({ id: cardId, status })
            
            await resolver.Mutation.moveCard(null, { cardId, status }, context)
            
            expect(service.moveCard).toHaveBeenCalledWith(cardId, status, 'user-1')
            expect(context.pubsub.emitter.emit).toHaveBeenCalled()
        })
        
        it('updateCard', async () => {
            const cardId = 'c-1'
            const input = { title: 'New' }
            vi.spyOn(service, 'updateCard').mockResolvedValue({ id: cardId, ...input })
            
            await resolver.Mutation.updateCard(null, { cardId, input }, context)
            
            expect(service.updateCard).toHaveBeenCalledWith(cardId, input, 'user-1')
            expect(context.pubsub.emitter.emit).toHaveBeenCalled()
        })
        
        it('addCardComment', async () => {
            vi.spyOn(service, 'addComment').mockResolvedValue({ id: 'comment-1' })
            vi.spyOn(service.repository, 'findById').mockResolvedValue({ id: 'card-1' })
            
            await resolver.Mutation.addCardComment(null, { cardId: 'card-1', content: 'Hi' }, context)
            
            expect(service.addComment).toHaveBeenCalledWith('card-1', 'Hi', 'user-1')
            expect(context.pubsub.emitter.emit).toHaveBeenCalled()
        })
        
         it('deleteCard', async () => {
            vi.spyOn(service, 'deleteCard').mockResolvedValue(true)
            await resolver.Mutation.deleteCard(null, { cardId: 'c-1' })
            expect(service.deleteCard).toHaveBeenCalledWith('c-1')
        })

        it('createCardFromTask', async () => {
             prisma.project.findUnique.mockResolvedValue({ name: 'Tag' })
             vi.spyOn(service, 'createCardStructureFromTask').mockResolvedValue({ id: 'c-1' })
             await resolver.Mutation.createCardFromTask(null, { taskId: 't-1', projectId: 'p-1' })
             expect(service.createCardStructureFromTask).toHaveBeenCalled()
        })

        it('addSubtask', async () => {
             vi.spyOn(service, 'addSubtask').mockResolvedValue({ id: 's-1' })
             await resolver.Mutation.addSubtask(null, { parentCardId: 'p-1', title: 'Sub' })
             expect(service.addSubtask).toHaveBeenCalledWith('p-1', 'Sub')
        })
    })

    describe('Subscription.cardUpdated', () => {
        it('should subscribe to CARD_UPDATED_{cardId}', async () => {
            const cardId = 'card-1'
            await resolver.Subscription.cardUpdated.subscribe(null, { cardId }, context)
            expect(context.pubsub.subscribe).toHaveBeenCalledWith(`CARD_UPDATED_${cardId}`)
        })
    })

    describe('Mutation.addReaction', () => {
        it('should toggle off if reaction exists', async () => {
            const commentId = 'comment-1'
            const emoji = '👍'
            const existingReaction = { id: 'reaction-1', commentId, emoji, userId: 'user-1' }

            prisma.cardCommentReaction.findUnique.mockResolvedValue(existingReaction)
            prisma.cardCommentReaction.delete.mockResolvedValue(existingReaction)
            prisma.cardComment.findUnique.mockResolvedValue({ id: commentId, cardId: 'card-1' })

            const result = await resolver.Mutation.addReaction(null, { commentId, emoji }, context)

            expect(prisma.cardCommentReaction.delete).toHaveBeenCalledWith(expect.objectContaining({ 
                where: { id: existingReaction.id },
                include: { user: { include: { collaborator: true } } }
            }))
            expect(context.pubsub.emitter.emit).toHaveBeenCalledWith(expect.objectContaining({
                topic: 'CARD_UPDATED_card-1',
                payload: expect.any(Object)
            }))
            expect(result).toEqual(existingReaction)
        })

        it('should create new reaction if not exists', async () => {
            const commentId = 'comment-1'
            const emoji = '👍'

            prisma.cardCommentReaction.findUnique.mockResolvedValue(null)
            prisma.cardCommentReaction.create.mockResolvedValue({ id: 'new-reaction', emoji })
            prisma.cardComment.findUnique.mockResolvedValue({ id: commentId, cardId: 'card-1' })

            const result = await resolver.Mutation.addReaction(null, { commentId, emoji }, context)

            expect(prisma.cardCommentReaction.create).toHaveBeenCalled()
            expect(context.pubsub.emitter.emit).toHaveBeenCalledWith(expect.objectContaining({
                topic: 'CARD_UPDATED_card-1',
                payload: expect.any(Object)
            }))
            expect(result.id).toBe('new-reaction')
        })
    })


    describe('Mutation.deleteCardComment', () => {
        it('should soft delete comment and log event', async () => {
            const commentId = 'c-1'
            const cardId = 'card-1'
            const userId = 'user-1'
            const comment = { id: commentId, cardId, authorId: userId, content: 'To be deleted' }
            const user = { id: userId, collaborator: { id: 'col-1', systemRole: 2 } } // Regular user

            prisma.cardComment.findUnique.mockResolvedValue(comment)
            prisma.user.findUnique.mockResolvedValue(user)
            prisma.cardComment.update.mockResolvedValue({ ...comment, isDeleted: true })
            
            const result = await resolver.Mutation.deleteCardComment(null, { commentId }, context)
            
            expect(prisma.cardComment.update).toHaveBeenCalledWith({
                where: { id: commentId },
                data: { isDeleted: true }
            })
            expect(prisma.cardEvent.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: 'COMMENT_DELETED',
                    details: 'To be deleted'
                })
            }))
            expect(result).toBe(true)
        })

        it('should throw forbidden if not author or admin', async () => {
            const commentId = 'c-1'
            const userId = 'user-2' // Different user
            const comment = { id: commentId, authorId: 'user-1' }
            const user = { id: userId, collaborator: { systemRole: 2 } }

            prisma.cardComment.findUnique.mockResolvedValue(comment)
            prisma.user.findUnique.mockResolvedValue(user)
            
            const userContext = { ...context, user: { userId: 'user-2' } }

            await expect(resolver.Mutation.deleteCardComment(null, { commentId }, userContext))
                .rejects.toThrow('Forbidden')
        })
    })

    describe('Mutation.editCardComment', () => {
        it('should update comment and log history/event', async () => {
            const commentId = 'c-1'
            const cardId = 'card-1'
            const userId = 'user-1'
            const oldContent = 'Old'
            const newContent = 'New'
            const comment = { id: commentId, cardId, authorId: userId, content: oldContent }
            const user = { id: userId, collaborator: { systemRole: 2 } }

            prisma.cardComment.findUnique.mockResolvedValue(comment)
            prisma.user.findUnique.mockResolvedValue(user)
            prisma.cardComment.update.mockResolvedValue({ ...comment, content: newContent })
            
            await resolver.Mutation.editCardComment(null, { commentId, content: newContent }, context)
            
            expect(prisma.cardCommentHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ content: oldContent })
            }))
            expect(prisma.cardComment.update).toHaveBeenCalledWith({
                where: { id: commentId },
                data: { content: newContent }
            })
            expect(prisma.cardEvent.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: 'COMMENT_EDITED',
                    details: newContent
                })
            }))
        })

        it('should throw forbidden if not author or admin', async () => {
            prisma.cardComment.findUnique.mockResolvedValue({ id: 'c-1', authorId: 'u-1' })
            prisma.user.findUnique.mockResolvedValue({ id: 'u-2', collaborator: { systemRole: 2 } })
            const userContext = { ...context, user: { userId: 'u-2' } }
            await expect(resolver.Mutation.editCardComment(null, { commentId: 'c-1', content: 'x' }, userContext))
                .rejects.toThrow('Forbidden')
        })
    })

    describe('Field Resolvers', () => {
        describe('KanbanCard', () => {
            it('children', async () => {
                const parent = { id: 'p-1' }
                prisma.kanbanCard.findMany.mockResolvedValue([{ id: 'c-1' }])
                expect(await resolver.KanbanCard.children(parent)).toHaveLength(1)
                expect(prisma.kanbanCard.findMany).toHaveBeenCalledWith({ where: { parentCardId: 'p-1' } })
            })
            
            it('comments', async () => {
               const parent = { id: 'p-1' }
               prisma.cardComment.findMany.mockResolvedValue([{ id: 'c-1' }])
               expect(await resolver.KanbanCard.comments(parent)).toHaveLength(1)
               expect(prisma.cardComment.findMany).toHaveBeenCalledWith({ where: { cardId: 'p-1', isDeleted: false } })
            })
            
            it('breadcrumbs', async () => {
                const card = { id: 'c-3', parentCardId: 'c-2' }
                prisma.kanbanCard.findUnique
                    .mockResolvedValueOnce({ id: 'c-2', parentCardId: 'c-1' })
                    .mockResolvedValueOnce({ id: 'c-1', parentCardId: null })
                    
                const path = await resolver.KanbanCard.breadcrumbs(card)
                expect(path).toHaveLength(2)
                expect(path[0].id).toBe('c-1')
                expect(path[1].id).toBe('c-2')
            })

            it('timeline', async () => {
                const parent = { id: 'c-1' }
                prisma.cardEvent.findMany.mockResolvedValue([{ id: 'e-1' }])
                expect(await resolver.KanbanCard.timeline(parent)).toHaveLength(1)
                expect(prisma.cardEvent.findMany).toHaveBeenCalledWith({ where: { cardId: 'c-1' } })
            })

            it('collaborators', async () => {
                const parent = { id: 'c-1' }
                // Mock fluent chain
                const mockFluent = {
                    collaborators: vi.fn().mockResolvedValue([{ id: 'col-1' }]),
                    roles: vi.fn().mockResolvedValue([{ id: 'role-1' }])
                }
                prisma.kanbanCard.findUnique.mockReturnValue(mockFluent)
                
                expect(await resolver.KanbanCard.collaborators(parent)).toHaveLength(1)
                expect(mockFluent.collaborators).toHaveBeenCalled()
                
                expect(await resolver.KanbanCard.roles(parent)).toHaveLength(1)
                expect(mockFluent.roles).toHaveBeenCalled()
            })
        })
        
        describe('CardComment', () => {
            it('author', async () => {
                prisma.user.findUnique.mockResolvedValue({ id: 'u-1' })
                await resolver.CardComment.author({ authorId: 'u-1' })
                expect(prisma.user.findUnique).toHaveBeenCalled()
            })

            it('reactions', async () => {
                const parent = { id: 'c-1' }
                prisma.cardCommentReaction.findMany.mockResolvedValue([{ id: 'r-1' }])
                await resolver.CardComment.reactions(parent)
                expect(prisma.cardCommentReaction.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { commentId: 'c-1' } }))
            })

            it('history', async () => {
                const parent = { id: 'c-1' }
                prisma.cardCommentHistory.findMany.mockResolvedValue([{ id: 'h-1' }])
                await resolver.CardComment.history(parent)
                expect(prisma.cardCommentHistory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { commentId: 'c-1' } }))
            })
        })

        describe('CardEvent', () => {
            it('author', async () => {
                prisma.user.findUnique.mockResolvedValue({ id: 'u-1' })
                await resolver.CardEvent.author({ authorId: 'u-1' })
                expect(prisma.user.findUnique).toHaveBeenCalled()
            })
        })
     })
})
