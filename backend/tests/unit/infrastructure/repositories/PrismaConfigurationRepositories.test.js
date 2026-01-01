
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
    PrismaRoleRepository, 
    PrismaSkillRepository,
    PrismaTechnologyRepository,
    PrismaMilestoneTypeRepository,
    PrismaHierarchyTypeRepository,
    PrismaCustomFieldRepository,
    PrismaWorkPackageStatusRepository
} from '../../../../src/infrastructure/repositories/PrismaConfigurationRepositories.js'
import { prisma } from '../../../../src/infrastructure/database/client.js'

vi.mock('../../../../src/infrastructure/database/client.js', () => ({
  prisma: {
    role: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    skill: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    technology: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    milestoneType: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    milestone: { count: vi.fn() },
    hierarchyType: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    customFieldDefinition: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    customFieldValue: { upsert: vi.fn() },
    workPackageStatus: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
  }
}))

describe('Configuration Repositories', () => {
    beforeEach(() => { vi.clearAllMocks() })

    describe('PrismaRoleRepository', () => {
        const repo = new PrismaRoleRepository()
        it('CRUD', async () => {
            await repo.findAll('org-1')
            expect(prisma.role.findMany).toHaveBeenCalledWith({ where: { organizationId: 'org-1' } })
            
            await repo.findById('r-1')
            expect(prisma.role.findUnique).toHaveBeenCalled()
            
            await repo.create({ name: 'Dev' })
            expect(prisma.role.create).toHaveBeenCalled()
            
            await repo.delete('r-1')
            expect(prisma.role.delete).toHaveBeenCalled()
        })
    })

    describe('PrismaSkillRepository', () => {
        const repo = new PrismaSkillRepository()
        it('CRUD', async () => {
            await repo.findAll('org-1')
            expect(prisma.skill.findMany).toHaveBeenCalled()
            
            await repo.findById('s-1')
            expect(prisma.skill.findUnique).toHaveBeenCalled()
            
            await repo.create({ name: 'JS' })
            expect(prisma.skill.create).toHaveBeenCalled()
            
            await repo.delete('s-1')
            expect(prisma.skill.delete).toHaveBeenCalled()
        })
    })

    describe('PrismaTechnologyRepository', () => {
        const repo = new PrismaTechnologyRepository()
        it('CRUD', async () => {
            await repo.findAll('org-1')
            expect(prisma.technology.findMany).toHaveBeenCalled()
            await repo.create({ name: 'React' })
            expect(prisma.technology.create).toHaveBeenCalled()
            await repo.delete('t-1')
            expect(prisma.technology.delete).toHaveBeenCalled()
        })
    })

    describe('PrismaMilestoneTypeRepository', () => {
        const repo = new PrismaMilestoneTypeRepository()
        it('CRUD', async () => {
            await repo.findAll('org-1')
            expect(prisma.milestoneType.findMany).toHaveBeenCalled()
            await repo.create({ name: 'M1' })
            expect(prisma.milestoneType.create).toHaveBeenCalled()
            await repo.update('m-1', { name: 'M2' })
            expect(prisma.milestoneType.update).toHaveBeenCalled()
            await repo.delete('m-1')
            expect(prisma.milestoneType.delete).toHaveBeenCalled()
            
            await repo.countUsage('m-1')
            expect(prisma.milestone.count).toHaveBeenCalledWith({ where: { milestoneTypeId: 'm-1' } })
        })
    })

    describe('PrismaHierarchyTypeRepository', () => {
        const repo = new PrismaHierarchyTypeRepository()
        it('CRUD', async () => {
            await repo.findAll('org-1')
            expect(prisma.hierarchyType.findMany).toHaveBeenCalled()
            await repo.create({ name: 'H1' })
            expect(prisma.hierarchyType.create).toHaveBeenCalled()
            await repo.update('h-1', { name: 'H2' })
            expect(prisma.hierarchyType.update).toHaveBeenCalled()
            await repo.delete('h-1')
            expect(prisma.hierarchyType.delete).toHaveBeenCalled()
        })
    })

    describe('PrismaWorkPackageStatusRepository', () => {
        const repo = new PrismaWorkPackageStatusRepository()
        it('CRUD', async () => {
             await repo.findAll('org-1')
            expect(prisma.workPackageStatus.findMany).toHaveBeenCalled()
            await repo.create({ name: 'S1' })
            expect(prisma.workPackageStatus.create).toHaveBeenCalled()
            await repo.update('s-1', { name: 'S2' })
            expect(prisma.workPackageStatus.update).toHaveBeenCalled()
            await repo.delete('s-1')
            expect(prisma.workPackageStatus.delete).toHaveBeenCalled()
        })
    })

    describe('PrismaCustomFieldRepository', () => {
        const repo = new PrismaCustomFieldRepository()
         it('CRUD', async () => {
             await repo.findAll('org-1')
            expect(prisma.customFieldDefinition.findMany).toHaveBeenCalled()
            await repo.create({ name: 'F1' })
            expect(prisma.customFieldDefinition.create).toHaveBeenCalled()
            await repo.update('f-1', { name: 'F2' })
            expect(prisma.customFieldDefinition.update).toHaveBeenCalled()
            await repo.delete('f-1')
            expect(prisma.customFieldDefinition.delete).toHaveBeenCalled()
        })
        
        it('setValue', async () => {
            await repo.setValue({ collaboratorId: 'c-1', fieldDefinitionId: 'fd-1', value: 'val' })
            expect(prisma.customFieldValue.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    collaboratorId_fieldDefinitionId: { collaboratorId: 'c-1', fieldDefinitionId: 'fd-1' }
                },
                create: expect.objectContaining({ value: 'val' }),
                update: { value: 'val' }
            }))
        })
    })
})
