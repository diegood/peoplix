
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaKanbanRepository } from '../../../../src/infrastructure/repositories/PrismaKanbanRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    kanbanCard: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
    },
    user: { findUnique: vi.fn() },
    cardComment: { create: vi.fn() },
    cardEvent: { create: vi.fn() }
  }
}))

describe('PrismaKanbanRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaKanbanRepository()
  })

  describe('Cards', () => {
      it('create', async () => {
          const data = { title: 'Card' }
          await repository.create(data)
          expect(prisma.kanbanCard.create).toHaveBeenCalledWith({ data })
      })

      it('findById', async () => {
          await repository.findById('c-1')
          expect(prisma.kanbanCard.findUnique).toHaveBeenCalledWith({
              where: { id: 'c-1' },
              include: expect.anything()
          })
      })

      it('findByReadableId with projectTag', async () => {
          await repository.findByReadableId('TAG-1', 'TAG', 'ORG')
          expect(prisma.kanbanCard.findFirst).toHaveBeenCalledWith(expect.objectContaining({
              where: {
                  readableId: 'TAG-1',
                  isDeleted: false,
                  project: { tag: 'TAG', organization: { tag: 'ORG' } }
              }
          }))
      })

      it('findByReadableId with orgTag only', async () => {
          await repository.findByReadableId('TAG-1', null, 'ORG')
          expect(prisma.kanbanCard.findFirst).toHaveBeenCalledWith(expect.objectContaining({
              where: {
                  readableId: 'TAG-1',
                  isDeleted: false,
                  project: { organization: { tag: 'ORG' } }
              }
          }))
      })

      it('findByProject', async () => {
          await repository.findByProject('p-1')
          expect(prisma.kanbanCard.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: { projectId: 'p-1', isDeleted: false }
          }))
      })

      it('findByProject with userId filter', async () => {
          prisma.user.findUnique.mockResolvedValue({ id: 'u-1', collaborator: { id: 'col-1' } })
          await repository.findByProject('p-1', 'u-1')
          expect(prisma.kanbanCard.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: { 
                  projectId: 'p-1', 
                  isDeleted: false,
                  collaborators: { some: { id: 'col-1' } }
              }
          }))
      })
      
      it('findMaxReadableId', async () => {
          prisma.kanbanCard.findFirst.mockResolvedValue({ readableId: 'TAG-5' })
          const res = await repository.findMaxReadableId('TAG-')
          expect(res).toBe('TAG-5')
          
          prisma.kanbanCard.findFirst.mockResolvedValue(null)
          const resNull = await repository.findMaxReadableId('TAG-')
          expect(resNull).toBeNull()
      })

      it('update', async () => {
          await repository.update('c-1', { title: 'New' })
          expect(prisma.kanbanCard.update).toHaveBeenCalled()
      })

      it('updateStatus', async () => {
          await repository.updateStatus('c-1', 'DONE')
          expect(prisma.kanbanCard.update).toHaveBeenCalledWith({
              where: { id: 'c-1' },
              data: { status: 'DONE' }
          })
      })

      it('softDelete', async () => {
          await repository.softDelete('c-1')
          expect(prisma.kanbanCard.update).toHaveBeenCalledWith({
              where: { id: 'c-1' },
              data: { isDeleted: true }
          })
      })
  })

  describe('Events & Comments', () => {
      it('addComment', async () => {
          await repository.addComment({ content: 'Hi' })
          expect(prisma.cardComment.create).toHaveBeenCalled()
      })

      it('addEvent', async () => {
          await repository.addEvent({ type: 'CREATED' })
          expect(prisma.cardEvent.create).toHaveBeenCalled()
      })
  })
})
