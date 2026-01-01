
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '../../../src/infrastructure/database/client.js'
import resolver from '../../../src/interfaces/graphql/resolvers/kanban.resolver.js'
import { KanbanService } from '../../../src/application/services/KanbanService.js'

vi.mock('../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    cardCommentReaction: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn()
    },
    cardComment: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock('../../../src/application/services/KanbanService.js', () => {
  const MockKanbanService = vi.fn()
  MockKanbanService.prototype.repository = { findById: vi.fn().mockResolvedValue({ id: 'card-1' }) }
  MockKanbanService.prototype.addComment = vi.fn().mockResolvedValue({})
  MockKanbanService.prototype.moveCard = vi.fn().mockResolvedValue({})
  MockKanbanService.prototype.updateCard = vi.fn().mockResolvedValue({})
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
                subscribe: vi.fn()
            }
        }
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

            expect(prisma.cardCommentReaction.delete).toHaveBeenCalledWith({ where: { id: existingReaction.id } })
            expect(context.pubsub.publish).toHaveBeenCalledWith('CARD_UPDATED_card-1', expect.any(Object))
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
            expect(context.pubsub.publish).toHaveBeenCalledWith('CARD_UPDATED_card-1', expect.any(Object))
            expect(result.id).toBe('new-reaction')
        })
    })
})
