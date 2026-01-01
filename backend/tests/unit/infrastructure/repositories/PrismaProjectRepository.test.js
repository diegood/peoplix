
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaProjectRepository } from '../../../../src/infrastructure/repositories/PrismaProjectRepository.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    project: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    projectRequirement: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    skill: { findUnique: vi.fn(), create: vi.fn() },
    requirementSkill: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    milestone: { create: vi.fn(), delete: vi.fn() }
  }
}))

describe('PrismaProjectRepository', () => {
  let repository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PrismaProjectRepository()
  })

  describe('Project CRUD', () => {
      it('findAll', async () => {
          await repository.findAll('org-1')
          expect(prisma.project.findMany).toHaveBeenCalledWith({
              where: { organizationId: 'org-1' },
              include: expect.anything()
          })
      })

      it('findById', async () => {
          await repository.findById('p-1')
          expect(prisma.project.findUnique).toHaveBeenCalled()
      })

      it('create', async () => {
          await repository.create({ name: 'P1', organizationId: 'org-1' })
          expect(prisma.project.create).toHaveBeenCalled()
      })

      it('update', async () => {
          await repository.update('p-1', { name: 'P2' })
          expect(prisma.project.update).toHaveBeenCalled()
      })
      
      it('delete', async () => {
          await repository.delete('p-1')
          expect(prisma.project.delete).toHaveBeenCalled()
      })
  })

  describe('Requirements', () => {
      it('addRequirement', async () => {
          await repository.addRequirement({ projectId: 'p-1', roleId: 'r-1' })
          expect(prisma.projectRequirement.create).toHaveBeenCalled()
      })

      it('updateRequirement', async () => {
          await repository.updateRequirement('req-1', { resourceCount: 2 })
          expect(prisma.projectRequirement.update).toHaveBeenCalled()
      })

      it('removeRequirement', async () => {
          await repository.removeRequirement('req-1')
          expect(prisma.projectRequirement.delete).toHaveBeenCalled()
      })
      
      it('addRequirementSkill (existing skill, new requirement)', async () => {
          prisma.skill.findUnique.mockResolvedValue({ id: 's-1' })
          prisma.requirementSkill.findFirst.mockResolvedValue(null)
          
          await repository.addRequirementSkill('req-1', 'JS', 5, 'org-1')
          
          expect(prisma.skill.findUnique).toHaveBeenCalled()
          expect(prisma.requirementSkill.create).toHaveBeenCalledWith({
              data: { requirementId: 'req-1', skillId: 's-1', level: 5 },
              include: { skill: true }
          })
      })

      it('addRequirementSkill (new skill, existing requirement)', async () => {
          prisma.skill.findUnique.mockResolvedValue(null)
          prisma.skill.create.mockResolvedValue({ id: 's-2' })
          prisma.requirementSkill.findFirst.mockResolvedValue({ id: 'rs-1' })
          
          await repository.addRequirementSkill('req-1', 'GO', 5, 'org-1')
          
          expect(prisma.skill.create).toHaveBeenCalled()
          expect(prisma.requirementSkill.update).toHaveBeenCalled()
      })

      it('removeRequirementSkill', async () => {
          await repository.removeRequirementSkill('req-1', 's-1')
          expect(prisma.requirementSkill.deleteMany).toHaveBeenCalled()
      })
  })

  describe('Milestones', () => {
      it('createMilestone', async () => {
          await repository.createMilestone({ projectId: 'p-1', name: 'M1' })
          expect(prisma.milestone.create).toHaveBeenCalled()
      })

      it('deleteMilestone', async () => {
          await repository.deleteMilestone('m-1')
          expect(prisma.milestone.delete).toHaveBeenCalled()
      })
  })
})
