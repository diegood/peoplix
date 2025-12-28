
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
            addHardware: vi.fn(),
            removeHardware: vi.fn(),
            updateHolidayCalendar: vi.fn(),
            addCareerObjective: vi.fn(),
            updateCareerObjective: vi.fn(),
            deleteCareerObjective: vi.fn(),
            addMeeting: vi.fn(),
            updateMeeting: vi.fn(),
            deleteMeeting: vi.fn(),
            addActionItem: vi.fn(),
            updateActionItem: vi.fn(),
            deleteActionItem: vi.fn(),
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

    describe('Basic CRUD', () => {
        it('update should convert dates and delegate', async () => {
            const id = 'c1';
            const data = { joinDate: '2025-01-01', firstName: 'Jane' };
            await service.update(id, data);
            expect(mockRepository.update).toHaveBeenCalledWith(id, expect.objectContaining({
                firstName: 'Jane',
                joinDate: expect.any(String) // or Date depending on impl, service uses toISOString() -> String
            }));
        });
        
        it('delete should delegate', async () => {
            await service.delete('c1');
            expect(mockRepository.delete).toHaveBeenCalledWith('c1');
        });
        
        it('getById should delegate', async () => {
            await service.getById('c1');
            expect(mockRepository.findById).toHaveBeenCalledWith('c1');
        });
    });

    describe('Skills & Hardware', () => {
        it('Skills Delegation', async () => {
            await service.addSkill('c1', 's1', 5);
            expect(mockRepository.addSkill).toHaveBeenCalledWith('c1', 's1', 5);
            
            await service.removeSkill('c1', 's1');
            expect(mockRepository.removeSkill).toHaveBeenCalledWith('c1', 's1');
        });

        it('Hardware Delegation', async () => {
            const data = { name: 'Laptop' };
            await service.addHardware(data);
            expect(mockRepository.addHardware).toHaveBeenCalledWith(data);
            
            await service.removeHardware('h1');
            expect(mockRepository.removeHardware).toHaveBeenCalledWith('h1');
        });

        it('Holiday Calendar Delegation', async () => {
            const data = { calendarId: 'cal1' };
            await service.updateHolidayCalendar(data);
            expect(mockRepository.updateHolidayCalendar).toHaveBeenCalledWith(data);
        });
    });

    describe('Career Objectives', () => {
        it('CRUD Delegation', async () => {
            await service.addCareerObjective('c1', 2025, 1, 'Goal', 'skill1', 5);
            expect(mockRepository.addCareerObjective).toHaveBeenCalledWith(expect.objectContaining({
                 collaboratorId: 'c1',
                 year: 2025,
                 status: 'PENDING'
             }));

             await service.updateCareerObjective('obj1', 'ACHIEVED');
             expect(mockRepository.updateCareerObjective).toHaveBeenCalledWith('obj1', { status: 'ACHIEVED' });

             await service.deleteCareerObjective('obj1');
             expect(mockRepository.deleteCareerObjective).toHaveBeenCalledWith('obj1');
        });
    });

    describe('Meetings & Action Items', () => {
        it('Meeting CRUD', async () => {
            await service.addMeeting('c1', '2025-01-01', 'Notes');
            expect(mockRepository.addMeeting).toHaveBeenCalledWith(expect.objectContaining({
                date: expect.any(Date)
            }));

            await service.updateMeeting('m1', { date: '2025-01-02' });
            expect(mockRepository.updateMeeting).toHaveBeenCalledWith('m1', expect.objectContaining({
                date: expect.any(Date)
            }));

            await service.deleteMeeting('m1');
            expect(mockRepository.deleteMeeting).toHaveBeenCalledWith('m1');
        });

        it('Action Item CRUD', async () => {
            await service.addMeetingActionItem('m1', 'Do this');
            expect(mockRepository.addActionItem).toHaveBeenCalledWith(expect.objectContaining({
                meetingId: 'm1',
                status: 'PENDING'
            }));

            await service.updateMeetingActionItem('ai1', { status: 'DONE' });
            expect(mockRepository.updateActionItem).toHaveBeenCalledWith('ai1', { status: 'DONE' });
            
            await service.deleteMeetingActionItem('ai1');
            expect(mockRepository.deleteActionItem).toHaveBeenCalledWith('ai1');
        });
    });
});
