
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllocationService } from '../../../src/application/services/AllocationService.js';

describe('AllocationService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepository = {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            addRole: vi.fn(),
            removeRole: vi.fn(),
            addHierarchy: vi.fn(),
            removeHierarchy: vi.fn(),
            findRoles: vi.fn(),
            findSupervisors: vi.fn(),
            findSubordinates: vi.fn(),
        };
        service = new AllocationService(mockRepository);
    });

    it('create should delegate to repository', async () => {
        const data = { projectId: 'p1', collaboratorId: 'c1', percentage: 50 };
        await service.create(data);
        expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            dedicationPercentage: 50
        }));
    });

    it('update should filter undefined fields', async () => {
        const id = 'a1';
        // Only percentage provided
        await service.update(id, { percentage: 80 }); 
        expect(mockRepository.update).toHaveBeenCalledWith(id, { dedicationPercentage: 80 });

        // Provide unrelated field -> empty update (or mocked behavior)
        await service.update(id, { startWeek: 10 });
        expect(mockRepository.update).toHaveBeenCalledWith(id, { startWeek: 10 });
    });

    it('delete should delegate', async () => {
        await service.delete('a1');
        expect(mockRepository.delete).toHaveBeenCalledWith('a1');
    });

    it('Role management delegation', async () => {
        await service.addRole('a1', 'r1');
        expect(mockRepository.addRole).toHaveBeenCalledWith('a1', 'r1');
        
        await service.removeRole('a1', 'r1');
        expect(mockRepository.removeRole).toHaveBeenCalledWith('a1', 'r1');

        await service.getRoles('a1');
        expect(mockRepository.findRoles).toHaveBeenCalledWith('a1');
    });

    it('Hierarchy management delegation', async () => {
         await service.addHierarchy('sub1', 'sup1', 'type1');
         expect(mockRepository.addHierarchy).toHaveBeenCalledWith('sub1', 'sup1', 'type1');

         await service.removeHierarchy('h1');
         expect(mockRepository.removeHierarchy).toHaveBeenCalledWith('h1');
         
         await service.getSupervisors('sub1');
         expect(mockRepository.findSupervisors).toHaveBeenCalledWith('sub1');
         
         await service.getSubordinates('sup1');
         expect(mockRepository.findSubordinates).toHaveBeenCalledWith('sup1');
    });
});
