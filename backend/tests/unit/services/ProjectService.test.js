
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '../../../src/application/services/ProjectService.js';

describe('ProjectService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockRepository = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            addRequirement: vi.fn(),
            updateRequirement: vi.fn(),
            removeRequirement: vi.fn(),
            addRequirementSkill: vi.fn(),
            removeRequirementSkill: vi.fn(),
            createMilestone: vi.fn(),
            deleteMilestone: vi.fn(),
        };

        service = new ProjectService(mockRepository);
    });

    describe('getAll', () => {
        it('should delegate to repository.findAll', async () => {
            const orgId = 'org-1';
            const args = { search: 'test' };
            await service.getAll(orgId, args);
            expect(mockRepository.findAll).toHaveBeenCalledWith(orgId, args);
        });
    });

    describe('getById', () => {
        it('should delegate to repository.findById', async () => {
            const id = 'proj-1';
            await service.getById(id);
            expect(mockRepository.findById).toHaveBeenCalledWith(id);
        });
    });

    describe('create', () => {
        it('should delegate to repository.create', async () => {
            const data = { name: 'New Project', organizationId: 'org-1' };
            await service.create(data);
            expect(mockRepository.create).toHaveBeenCalledWith(data);
        });
    });

    describe('update', () => {
        it('should delegate to repository.update', async () => {
            const id = 'proj-1';
            const data = { name: 'Updated Name' };
            await service.update(id, data);
            expect(mockRepository.update).toHaveBeenCalledWith(id, data);
        });
    });

    describe('delete', () => {
        it('should delegate to repository.delete', async () => {
            const id = 'proj-1';
            await service.delete(id);
            expect(mockRepository.delete).toHaveBeenCalledWith(id);
        });
    });

    describe('Requirements', () => {
        it('should delegate addRequirement', async () => {
            const data = { projectId: 'proj-1', roleId: 'role-1' };
            await service.addRequirement(data);
            expect(mockRepository.addRequirement).toHaveBeenCalledWith(data);
        });

        it('should delegate updateRequirement', async () => {
            const id = 'req-1';
            const data = { count: 5 };
            await service.updateRequirement(id, data);
            expect(mockRepository.updateRequirement).toHaveBeenCalledWith(id, data);
        });

        it('should delegate removeRequirement', async () => {
            const id = 'req-1';
            await service.removeRequirement(id);
            expect(mockRepository.removeRequirement).toHaveBeenCalledWith(id);
        });
        
        it('should delegate addRequirementSkill', async () => {
            const reqId = 'req-1';
            const skillName = 'Java';
            const level = 3;
            const orgId = 'org-1';
            await service.addRequirementSkill(reqId, skillName, level, orgId);
            expect(mockRepository.addRequirementSkill).toHaveBeenCalledWith(reqId, skillName, level, orgId);
        });

        it('should delegate removeRequirementSkill', async () => {
            const reqId = 'req-1';
            const skillId = 'skill-1';
            await service.removeRequirementSkill(reqId, skillId);
            expect(mockRepository.removeRequirementSkill).toHaveBeenCalledWith(reqId, skillId);
        });
    });

    describe('Milestones', () => {
        it('should delegate createMilestone', async () => {
             const data = { name: 'M1', projectId: 'proj-1' };
             await service.createMilestone(data);
             expect(mockRepository.createMilestone).toHaveBeenCalledWith(data);
        });

        it('should delegate deleteMilestone', async () => {
            const id = 'ms-1';
            await service.deleteMilestone(id);
            expect(mockRepository.deleteMilestone).toHaveBeenCalledWith(id);
        });
    });
});
