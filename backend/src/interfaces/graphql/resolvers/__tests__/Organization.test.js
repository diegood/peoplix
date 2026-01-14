
import { describe, it, expect, vi } from 'vitest'
import { organizationResolvers } from '../Organization.js'
import { prisma } from '../../../../infrastructure/database/client.js'

vi.mock('../../../../infrastructure/database/client.js', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    collaborator: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn((callback) => callback({
        organization: { create: vi.fn(() => ({ id: 'org-1' })) },
        user: { create: vi.fn(() => ({ id: 'user-1' })) },
        collaborator: { create: vi.fn() }
    }))
  }
}))

describe('Organization Resolvers', () => {
    describe('allOrganizations', () => {
        it('should return all organizations for Super Admin (role 0)', async () => {
            const context = { user: { role: 0, isSuperAdmin: true } }
            const mockOrgs = [{ id: '1', name: 'Org 1' }, { id: '2', name: 'Org 2' }]
            
            prisma.organization.findMany.mockResolvedValue(mockOrgs)
            
            const result = await organizationResolvers.Query.allOrganizations(null, null, context)
            
            expect(result).toEqual(mockOrgs)
            expect(prisma.organization.findMany).toHaveBeenCalled()
        })


    })

    describe('createOrganization', () => {
        it('should create organization successfully for Super Admin', async () => {
             const context = { user: { role: 0 } }
             const args = {
                 name: 'New Org',
                 tag: 'NEW',
                 adminEmail: 'admin@new.com',
                 adminPassword: 'pass',
                 adminFirstName: 'Ad',
                 adminLastName: 'Min'
             }

             prisma.user.findUnique.mockResolvedValue(null) // User doesn't exist
             prisma.organization.findUnique.mockResolvedValue(null) // Org tag doesn't exist
             
             // Since we mocked $transaction, we just verify it calls transaction
             await organizationResolvers.Mutation.createOrganization(null, args, context)
             
             expect(prisma.$transaction).toHaveBeenCalled()
        })
        
        it('should throw if validation fails (User exists)', async () => {
             const context = { user: { role: 0 } }
             const args = { adminEmail: 'existing@test.com' }
             
             prisma.user.findUnique.mockResolvedValue({ id: '1' })

             await expect(organizationResolvers.Mutation.createOrganization(null, args, context))
                .rejects.toThrow('User with this email already exists')
        })
    })

    describe('organizationAdmins', () => {
        it('should return admins for Super Admin', async () => {
            const context = { user: { role: 0 } }
            const mockAdmins = [{ id: 'admin1', systemRole: 1 }]
            prisma.collaborator.findMany.mockResolvedValue(mockAdmins)
            
            const result = await organizationResolvers.Query.organizationAdmins(null, { organizationId: 'org1' }, context)
            expect(result).toEqual(mockAdmins)
        })


    })

    describe('toggleOrganizationStatus', () => {
        it('should update organization status for Super Admin', async () => {
            const context = { user: { role: 0 } }
            const mockOrg = { id: 'org1', isActive: false }
            prisma.organization.update.mockResolvedValue(mockOrg)
            
            const result = await organizationResolvers.Mutation.toggleOrganizationStatus(null, { id: 'org1', isActive: false }, context)
            
            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: 'org1' },
                data: { isActive: false }
            })
            expect(result).toEqual(mockOrg)
        })


    })

    describe('updateOrganization', () => {
        it('should allow Super Admin to update any organization', async () => {
            const context = { user: { role: 0, isSuperAdmin: true, organizationId: 'my-org' } }
            const args = { id: 'other-org', name: 'Updated Name', tag: 'UPD' }
            
            prisma.organization.update.mockResolvedValue({ id: 'other-org', ...args })
            
            await organizationResolvers.Mutation.updateOrganization(null, args, context)
            
            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: 'other-org' },
                data: { name: 'Updated Name', tag: 'UPD' }
            })
        })

         it('should check unique tag if changed', async () => {
            const context = { user: { role: 0, isSuperAdmin: true, organizationId: 'my-org' } }
            const args = { id: 'other-org', tag: 'EXISTING' }
            
            prisma.organization.findUnique.mockResolvedValue({ id: 'another-org', tag: 'EXISTING' })
            
            await expect(organizationResolvers.Mutation.updateOrganization(null, args, context))
                .rejects.toThrow('Organization with this tag already exists')
        })
    })
})
