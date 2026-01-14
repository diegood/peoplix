
import { describe, it, expect, vi } from 'vitest'
import FunctionalRequirementService from '../../../../application/services/FunctionalRequirementService.js'
import { prisma } from '../../../../infrastructure/database/client.js'

// Mock Prisma
vi.mock('../../../../infrastructure/database/client.js', () => ({
  prisma: {
    functionalRequirement: {
        findUnique: vi.fn(),
        update: vi.fn()
    },
    functionalRequirementHistory: {
        create: vi.fn()
    }
  }
}))

describe('FunctionalRequirementService Auth Logic', () => {
    describe('update - BLOCKED status check', () => {
        const blockedRequirement = {
            id: 'req-1',
            status: 'BLOCKED',
            versionMajor: 1,
            versionMinor: 0,
            versionPatch: 0
        }

        it('should allow ADMIN to unlock a BLOCKED requirement', async () => {
            prisma.functionalRequirement.findUnique.mockResolvedValue(blockedRequirement)
            prisma.functionalRequirement.update.mockResolvedValue({ ...blockedRequirement, status: 'VALIDATED' })

            const adminUser = { id: 'admin1', role: 1 } // Admin role
            
            await expect(FunctionalRequirementService.update('req-1', { status: 'VALIDATED' }, adminUser))
                .resolves.not.toThrow()
        })

        it('should allow SUPER ADMIN to unlock a BLOCKED requirement', async () => {
            prisma.functionalRequirement.findUnique.mockResolvedValue(blockedRequirement)
            prisma.functionalRequirement.update.mockResolvedValue({ ...blockedRequirement, status: 'VALIDATED' })

            const superAdminUser = { id: 'sa1', isSuperAdmin: true }
            
            await expect(FunctionalRequirementService.update('req-1', { status: 'VALIDATED' }, superAdminUser))
                .resolves.not.toThrow()
        })

        it('should prevent USER from unlocking a BLOCKED requirement', async () => {
            prisma.functionalRequirement.findUnique.mockResolvedValue(blockedRequirement)

            const regularUser = { id: 'user1', role: 2 }
            
            await expect(FunctionalRequirementService.update('req-1', { status: 'VALIDATED' }, regularUser))
                .rejects.toThrow('Only admins can unlock it')
        })

        it('should allow USER to update non-BLOCKED requirement', async () => {
             const draftsReq = { ...blockedRequirement, status: 'DRAFT' }
             prisma.functionalRequirement.findUnique.mockResolvedValue(draftsReq)
             prisma.functionalRequirement.update.mockResolvedValue({ ...draftsReq, title: 'New Title' })

             const regularUser = { id: 'user1', role: 2 }
             
             await expect(FunctionalRequirementService.update('req-1', { title: 'New Title' }, regularUser))
                .resolves.not.toThrow()
        })
    })
})
