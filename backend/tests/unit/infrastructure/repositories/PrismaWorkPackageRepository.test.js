
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaWorkPackageRepository } from '../../../../src/infrastructure/repositories/PrismaWorkPackageRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    workPackage: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workPackageHistory: { create: vi.fn() }
  }
}))

describe('PrismaWorkPackageRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaWorkPackageRepository()
  })

  it('findByProjectId', async () => {
      await repository.findByProjectId('p-1')
      expect(prisma.workPackage.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { projectId: 'p-1' }
      }))
  })

  it('findByProjectId with status', async () => {
      await repository.findByProjectId('p-1', 'OPEN')
      expect(prisma.workPackage.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { projectId: 'p-1', status: 'OPEN' }
      }))
  })

  it('findById', async () => {
      await repository.findById('wp-1')
      expect(prisma.workPackage.findUnique).toHaveBeenCalled()
  })

  it('create', async () => {
      await repository.create({ name: 'WP', projectId: 'p-1' })
      expect(prisma.workPackage.create).toHaveBeenCalled()
  })

  it('update', async () => {
      await repository.update('wp-1', { name: 'WP2' })
      expect(prisma.workPackage.update).toHaveBeenCalled()
  })

  it('delete', async () => {
      await repository.delete('wp-1')
      expect(prisma.workPackage.delete).toHaveBeenCalled()
  })
  
  it('createHistory', async () => {
      await repository.createHistory({ workPackageId: 'wp-1' })
      expect(prisma.workPackageHistory.create).toHaveBeenCalled()
  })
})
