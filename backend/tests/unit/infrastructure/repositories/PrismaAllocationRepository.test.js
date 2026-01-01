
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAllocationRepository } from '../../../../src/infrastructure/repositories/PrismaAllocationRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    allocation: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    allocationRole: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn()
    },
    role: { findUnique: vi.fn() },
    allocationHierarchy: { create: vi.fn(), delete: vi.fn(), findMany: vi.fn() }
  }
}))

describe('PrismaAllocationRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaAllocationRepository()
  })

  describe('Allocation Lifecycle', () => {
      it('create', async () => {
          const data = {
              projectId: 'p-1',
              collaboratorId: 'c-1',
              dedicationPercentage: 50,
              startWeek: 1,
              endWeek: 10,
              roleId: 'r-1'
          }
          prisma.allocation.create.mockResolvedValue({ id: 'a-1', ...data })
          
          await repository.create(data)
          
          expect(prisma.allocation.create).toHaveBeenCalledWith({
              data: {
                  projectId: 'p-1',
                  collaboratorId: 'c-1',
                  dedicationPercentage: 50,
                  startWeek: 1,
                  endWeek: 10,
                  roles: { create: { roleId: 'r-1' } }
              },
              include: {
                  roles: { include: { role: true } },
                  collaborator: true,
                  project: true
              }
          })
      })

      it('update', async () => {
          const id = 'a-1'
          const data = { dedicationPercentage: 100 }
          prisma.allocation.update.mockResolvedValue({ id, ...data })
          await repository.update(id, data)
          expect(prisma.allocation.update).toHaveBeenCalledWith({
              where: { id },
              data,
              include: { roles: { include: { role: true } } }
          })
      })

      it('delete', async () => {
          const id = 'a-1'
          await repository.delete(id)
          expect(prisma.allocation.delete).toHaveBeenCalledWith({ where: { id } })
      })
  })

  describe('Roles', () => {
      it('addRole', async () => {
          const allocationId = 'a-1'
          const roleId = 'r-1'
          prisma.allocationRole.create.mockResolvedValue({})
          prisma.role.findUnique.mockResolvedValue({ id: roleId })
          
          const result = await repository.addRole(allocationId, roleId)
          expect(prisma.allocationRole.create).toHaveBeenCalledWith({ data: { allocationId, roleId } })
          expect(result.id).toBe(roleId)
      })

      it('removeRole', async () => {
          await repository.removeRole('a-1', 'r-1')
          expect(prisma.allocationRole.delete).toHaveBeenCalledWith({
              where: { allocationId_roleId: { allocationId: 'a-1', roleId: 'r-1' } }
          })
      })
      
      it('findRoles', async () => {
          prisma.allocationRole.findMany.mockResolvedValue([{ role: { id: 'r-1' } }])
          const roles = await repository.findRoles('a-1')
          expect(roles[0].id).toBe('r-1')
          expect(prisma.allocationRole.findMany).toHaveBeenCalledWith({
              where: { allocationId: 'a-1' },
              include: { role: true }
          })
      })
  })

  describe('Hierarchy', () => {
      it('addHierarchy', async () => {
          prisma.allocationHierarchy.create.mockResolvedValue({ id: 'h-1' })
          await repository.addHierarchy('sub-1', 'sup-1', 'type-1')
          expect(prisma.allocationHierarchy.create).toHaveBeenCalledWith(expect.objectContaining({
              data: { subordinateId: 'sub-1', supervisorId: 'sup-1', hierarchyTypeId: 'type-1' }
          }))
      })

      it('findSupervisors', async () => {
          prisma.allocationHierarchy.findMany.mockResolvedValue([])
          await repository.findSupervisors('sub-1')
          expect(prisma.allocationHierarchy.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: { subordinateId: 'sub-1' }
          }))
      })
      
      it('findSubordinates', async () => {
          prisma.allocationHierarchy.findMany.mockResolvedValue([])
          await repository.findSubordinates('sup-1')
          expect(prisma.allocationHierarchy.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: { supervisorId: 'sup-1' }
          }))
      })
  })
})
