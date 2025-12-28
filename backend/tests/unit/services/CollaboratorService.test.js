
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollaboratorService } from '../../../src/application/services/CollaboratorService.js';
import { prisma } from '../../../src/infrastructure/database/client.js';

// Mock the prisma client module
vi.mock('../../../src/infrastructure/database/client.js', () => {
    return {
        prisma: {
            user: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            collaborator: {
                findFirst: vi.fn(),
                create: vi.fn() 
            },
        }
    };
});

describe('CollaboratorService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockRepository = {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            addSkill: vi.fn(),
            removeSkill: vi.fn(),
        };

        // Inject the mock repository
        service = new CollaboratorService(mockRepository);
    });

    describe('create', () => {
        const orgId = 'org-123';
        const inputData = {
            userName: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            contractedHours: 40,
            organizationId: orgId,
            joinDate: '2025-01-01',
            systemRole: 2
        };

        it('should throw error if email (userName) is missing', async () => {
            await expect(service.create({ firstName: 'John' })).rejects.toThrow('Email (userName) is required');
        });

        it('should create a new user if one does not exist globally', async () => {
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(null); // User not found
            prisma.user.create.mockResolvedValue({ id: 'new-user-id', email: inputData.userName });
            
            prisma.collaborator.findFirst.mockResolvedValue(null); // Not member of org
            mockRepository.create.mockResolvedValue({ id: 'collab-1', ...inputData, userId: 'new-user-id' });

            // Execute
            const result = await service.create(inputData);

            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: inputData.userName } });
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: { email: inputData.userName, password: '123456' }
            });
            expect(prisma.collaborator.findFirst).toHaveBeenCalledWith({
                where: { userId: 'new-user-id', organizationId: orgId }
            });
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'new-user-id',
                organizationId: orgId
            }));
            expect(result).toBeDefined();
        });

        it('should link to existing user if found globally', async () => {
            // Setup mocks
            const existingUser = { id: 'existing-user-id', email: inputData.userName };
            prisma.user.findUnique.mockResolvedValue(existingUser);
            
            prisma.collaborator.findFirst.mockResolvedValue(null); // Not member of org
            mockRepository.create.mockResolvedValue({ id: 'collab-1', ...inputData, userId: existingUser.id });

            // Execute
            await service.create(inputData);

            // Assert
            expect(prisma.user.create).not.toHaveBeenCalled();
            expect(prisma.collaborator.findFirst).toHaveBeenCalledWith({
                where: { userId: existingUser.id, organizationId: orgId }
            });
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                userId: existingUser.id
            }));
        });

        it('should throw error if user is already a member of the organization', async () => {
             // Setup mocks
             const existingUser = { id: 'existing-user-id', email: inputData.userName };
             prisma.user.findUnique.mockResolvedValue(existingUser);
             
             // Already a member
             prisma.collaborator.findFirst.mockResolvedValue({ id: 'existing-collab', userId: existingUser.id, organizationId: orgId });
 
             // Execute & Assert
             await expect(service.create(inputData)).rejects.toThrow(`User ${inputData.userName} is already a member of this organization.`);
        });
    });

    describe('getAll', () => {
        it('should pass organizationId to repository', async () => {
            const orgId = 'org-abc';
            await service.getAll(orgId);
            expect(mockRepository.findAll).toHaveBeenCalledWith(orgId);
        });
    });
});
