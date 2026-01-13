
import { describe, it, expect, vi } from 'vitest'
import { collaboratorResolver } from '../collaborator.resolver.js'
import { prisma } from '../../../../infrastructure/database/client.js'

// Mock dependencies
vi.mock('../../../../infrastructure/database/client.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    collaborator: { 
        findMany: vi.fn(),
        findUnique: vi.fn() 
    }
  }
}))

// Mock Service
vi.mock('../../../../application/services/CollaboratorService.js', () => {
    return {
        CollaboratorService: class {
            getAll(orgId) { return Promise.resolve([{ id: '1', organizationId: orgId }]) }
            update(id, data) { return Promise.resolve({ id, ...data }) }
        }
    }
})

describe('Collaborator Resolvers', () => {
    describe('collaborators Query', () => {
        it('should allow Super Admin to list collaborators of a specific org', async () => {
            const context = { user: { role: 0, organizationId: 'my-org' } }
            const args = { organizationId: 'target-org' }
            
            const result = await collaboratorResolver.Query.collaborators(null, args, context)
            
            // Validate the result mocks what service returns for the target org
             expect(result[0].organizationId).toBe('target-org')
        })

        it('should default to own organization for Org Admin', async () => {
            const context = { user: { role: 1, organizationId: 'my-org' } }
            const args = { organizationId: 'target-org' } // Should be ignored/not override
            
            const result = await collaboratorResolver.Query.collaborators(null, args, context)
            
            expect(result[0].organizationId).toBe('my-org')
        })
    })

    describe('updateCollaborator Mutation', () => {
        it('should allow Super Admin to update systemRole', async () => {
            const context = { user: { role: 0, userId: 'super', organizationId: 'org1' } }
            const args = { id: 'collab1', systemRole: 1 }

            // Mock checkOwnerOrAdmin to not throw (since SA is admin)
            // But the resolver calls it directly. 
            // The logic inside updateCollaborator checks for systemRole permission first.
            
            // We need to spy on internal functions or just test the logic flow we can control.
            // Since `checkOwnerOrAdmin` is internal to the module scope, we can't easily mock it without rewriting the test to import/export it.
            // However, the test runs in an environment where we can rely on context.role. 
            
            const result = await collaboratorResolver.Mutation.updateCollaborator(null, args, context)
            expect(result.systemRole).toBe(1)
        })
    })
})
