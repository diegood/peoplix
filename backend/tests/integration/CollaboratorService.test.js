
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/database/client.js';
import { CollaboratorService } from '../../src/application/services/CollaboratorService.js';

describe('E2E: Collaborator Creation & User Linking', () => {
    let service;
    let organizationId;
    let createdUserIds = [];
    let createdCollabIds = [];

    beforeAll(async () => {
        service = new CollaboratorService();
        // Setup: Create Organization
        const org = await prisma.organization.create({
            data: { 
                name: 'E2E Collab Org ' + Date.now(),
                tag: 'ORG_COL_' + Date.now()
            }
        });
        organizationId = org.id;
    });

    afterAll(async () => {
        // Cleanup Collaborators (Cascade should handle allocations/etc if any)
        if (createdCollabIds.length > 0) {
            await prisma.collaborator.deleteMany({ where: { id: { in: createdCollabIds } } }).catch(() => {});
        }
        // Cleanup Users
        if (createdUserIds.length > 0) {
             await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
        }
        // Cleanup Org
        if (organizationId) {
            await prisma.organization.delete({ where: { id: organizationId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    it('should create a NEW User when creating a Collaborator with unique email', async () => {
        const uniqueEmail = `test.user.${Date.now()}@example.com`;
        const input = {
            firstName: 'New',
            lastName: 'User',
            contractedHours: 40,
            organizationId,
            userName: uniqueEmail, // This acts as email in the service logic if email not provided, or we can provide email explicitly
            email: uniqueEmail,
            joinDate: new Date(),
            systemRole: 2
        };

        const result = await service.create(input);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        createdCollabIds.push(result.id);
        
        // Verify User was created
        const user = await prisma.user.findUnique({ where: { email: uniqueEmail } });
        expect(user).toBeDefined();
        expect(user.email).toBe(uniqueEmail);
        createdUserIds.push(user.id);

        // Verify Linking
        expect(result.userId).toBe(user.id);
        
        // Verify Validation: Should not be able to create again in same org
        await expect(service.create(input)).rejects.toThrow('already a member');
    });

    it('should link to an EXISTING User when creating a Collaborator with existing email', async () => {
        // 1. Manually create a user
        const existingEmail = `existing.user.${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                email: existingEmail,
                username: existingEmail,
                password: 'password123'
            }
        });
        createdUserIds.push(user.id);

        // 2. Create Collaborator using this email
        const input = {
            firstName: 'Existing',
            lastName: 'User',
            contractedHours: 40,
            organizationId,
            email: existingEmail,
            userName: existingEmail,
            joinDate: '2025-01-01'
        };

        const result = await service.create(input);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        createdCollabIds.push(result.id);

        // Verify Linking
        expect(result.userId).toBe(user.id);
    });

    it('should strip email field from payload to avoid "Unknown argument" error', async () => {
        // This test specifically validates the fix we made. 
        // If the service passes 'email' to prisma.collaborator.create, this will fail.
        
        const uniqueEmail = `fix.test.${Date.now()}@example.com`;
        const input = {
            firstName: 'Fix',
            lastName: 'Test',
            contractedHours: 40,
            organizationId,
            email: uniqueEmail, // Field that causes issues if not stripped
            userName: uniqueEmail,
            joinDate: new Date()
        };

        const result = await service.create(input);
        
        expect(result).toBeDefined();
        createdCollabIds.push(result.id);
        
        if (result.userId) createdUserIds.push(result.userId);
    });
});
