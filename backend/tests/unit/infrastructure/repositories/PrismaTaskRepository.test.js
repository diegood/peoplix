
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaTaskRepository } from '../../../../src/infrastructure/repositories/PrismaTaskRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    task: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    taskEstimation: { upsert: vi.fn() }
  }
}))

describe('PrismaTaskRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaTaskRepository()
  })

  it('findById', async () => {
      await repository.findById('t-1')
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
          where: { id: 't-1' },
          include: expect.anything()
      })
  })

  it('create', async () => {
      await repository.create({ name: 'Task', workPackageId: 'wp-1' })
      expect(prisma.task.create).toHaveBeenCalled()
  })

  it('update', async () => {
      await repository.update('t-1', { name: 'New' })
      expect(prisma.task.update).toHaveBeenCalled()
  })

  it('delete', async () => {
      await repository.delete('t-1')
      expect(prisma.task.delete).toHaveBeenCalled()
  })

  it('saveEstimation', async () => {
      const data = { 
          taskId: 't-1', 
          roleId: 'r-1', 
          hours: 10,
          startDate: new Date(),
          endDate: new Date(),
          collaboratorId: 'c-1'
      }
      await repository.saveEstimation(data)
      expect(prisma.taskEstimation.upsert).toHaveBeenCalledWith(expect.objectContaining({
          where: { taskId_roleId: { taskId: 't-1', roleId: 'r-1' } },
          create: data,
          update: expect.objectContaining({ hours: 10 })
      }))
  })
})
