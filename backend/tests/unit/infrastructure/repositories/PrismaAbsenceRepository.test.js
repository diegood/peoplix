
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAbsenceRepository } from '../../../../src/infrastructure/repositories/PrismaAbsenceRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    absenceType: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    absence: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

describe('PrismaAbsenceRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaAbsenceRepository()
  })

  describe('Absence Types', () => {
    it('findAllTypes', async () => {
      const mockTypes = [{ id: 1, name: 'Sick' }]
      prisma.absenceType.findMany.mockResolvedValue(mockTypes)
      const result = await repository.findAllTypes()
      expect(result).toBe(mockTypes)
      expect(prisma.absenceType.findMany).toHaveBeenCalled()
    })

    it('createType', async () => {
      const data = { name: 'Holiday' }
      prisma.absenceType.create.mockResolvedValue(data)
      const result = await repository.createType(data)
      expect(result).toBe(data)
      expect(prisma.absenceType.create).toHaveBeenCalledWith({ data })
    })

    it('updateType', async () => {
        const id = 1
        const data = { name: 'Holiday' }
        prisma.absenceType.update.mockResolvedValue(data)
        const result = await repository.updateType(id, data)
        expect(result).toBe(data)
        expect(prisma.absenceType.update).toHaveBeenCalledWith({ where: { id }, data })
      })

    it('deleteType', async () => {
        const id = 1
        prisma.absenceType.delete.mockResolvedValue(true)
        const result = await repository.deleteType(id)
        expect(result).toBe(true)
        expect(prisma.absenceType.delete).toHaveBeenCalledWith({ where: { id } })
    })
  })

  describe('Absences', () => {
      it('findAbsences with all filters', async () => {
          const filters = { 
              collaboratorId: 'c-1', 
              projectId: 'p-1', 
              startDate: '2023-01-01', 
              endDate: '2023-01-10' 
          }
          prisma.absence.findMany.mockResolvedValue([])
          
          await repository.findAbsences(filters)
          
          expect(prisma.absence.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: {
                  collaboratorId: 'c-1',
                  collaborator: { allocations: { some: { projectId: 'p-1' } } },
                  startDate: { lte: expect.any(Date) },
                  endDate: { gte: expect.any(Date) }
              },
              include: { type: true, collaborator: true },
              orderBy: { startDate: 'desc' }
          }))
      })

      it('createAbsence', async () => {
          const data = { reason: 'Sick' }
          prisma.absence.create.mockResolvedValue(data)
          await repository.createAbsence(data)
          expect(prisma.absence.create).toHaveBeenCalledWith({
              data,
              include: { type: true, collaborator: true }
          })
      })

      it('updateStatus', async () => {
          const id = 'a-1'
          const status = 'APPROVED'
          prisma.absence.update.mockResolvedValue({ id, status })
          await repository.updateStatus(id, status)
          expect(prisma.absence.update).toHaveBeenCalledWith({
              where: { id },
              data: { status },
              include: { type: true, collaborator: true }
          })
      })

      it('deleteAbsence', async () => {
          const id = 'a-1'
          prisma.absence.delete.mockResolvedValue(true)
          const result = await repository.deleteAbsence(id)
          expect(result).toBe(true)
          expect(prisma.absence.delete).toHaveBeenCalledWith({ where: { id } })
      })
  })
})
