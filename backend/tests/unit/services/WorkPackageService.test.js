
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkPackageService } from '../../../src/application/services/WorkPackageService.js';

describe('WorkPackageService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            findByProjectId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        service = new WorkPackageService(mockRepository);
    });

    describe('get', () => {
        it('should call repository.findById with correct id', async () => {
            const id = 'wp-1';
            await service.get(id);
            expect(mockRepository.findById).toHaveBeenCalledWith(id);
        });
    });

    describe('getByProject', () => {
        it('should call repository.findByProjectId with correct args', async () => {
            const projectId = 'proj-1';
            const status = 'IN_PROGRESS';
            await service.getByProject(projectId, status);
            expect(mockRepository.findByProjectId).toHaveBeenCalledWith(projectId, status);
        });

        it('should call repository.findByProjectId with null status if not provided', async () => {
            const projectId = 'proj-1';
            await service.getByProject(projectId);
            expect(mockRepository.findByProjectId).toHaveBeenCalledWith(projectId, null);
        });
    });

    describe('create', () => {
        it('should convert startDate string to Date object', async () => {
            const data = { name: 'New WP', startDate: '2025-01-01' };
            await service.create(data);
            
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New WP',
                startDate: expect.any(Date)
            }));
            
            // Allow flexibility in how the date is constructed, but ensure it matches the input date value
            const callArgs = mockRepository.create.mock.calls[0][0];
            expect(callArgs.startDate.toISOString().startsWith('2025-01-01')).toBe(true);
        });

        it('should pass data as is if no startDate provided', async () => {
            const data = { name: 'New WP' };
            await service.create(data);
            expect(mockRepository.create).toHaveBeenCalledWith(data);
        });
    });

    describe('update', () => {
        it('should convert startDate string to Date object', async () => {
            const id = 'wp-1';
            const data = { startDate: '2025-02-01' };
            
            mockRepository.findById.mockResolvedValue({ id, status: 'BACKLOG' });
            mockRepository.update.mockResolvedValue({ id, startDate: new Date('2025-02-01') });

            await service.update(id, data);
            
            expect(mockRepository.update).toHaveBeenCalledWith(id, expect.objectContaining({
                startDate: expect.any(Date)
            }));

             const callArgs = mockRepository.update.mock.calls[0][1];
             expect(callArgs.startDate.toISOString().startsWith('2025-02-01')).toBe(true);
        });

         it('should pass data as is if no startDate provided', async () => {
            const id = 'wp-1';
            const data = { name: 'Updated Name' };
            
            mockRepository.findById.mockResolvedValue({ id, status: 'BACKLOG' });
            mockRepository.update.mockResolvedValue({ id, ...data });

            await service.update(id, data);
            expect(mockRepository.update).toHaveBeenCalledWith(id, data);
        });

        it('should log history if status changes', async () => {
            const id = 'wp-1';
            const current = { id, status: 'BACKLOG' };
            const data = { status: 'DONE' };
            const userId = 'user-1';

            mockRepository.findById.mockResolvedValue(current);
            mockRepository.update.mockResolvedValue({ ...current, ...data });
            mockRepository.createHistory = vi.fn(); // Mock this specific method on the fly if not in base mock

            await service.update(id, data, userId);

            expect(mockRepository.createHistory).toHaveBeenCalledWith({
                workPackageId: id,
                field: 'STATUS',
                oldValue: 'BACKLOG',
                newValue: 'DONE',
                userId: userId
            });
        });
    });

    describe('delete', () => {
        it('should call repository.delete with correct id', async () => {
            const id = 'wp-1';
            await service.delete(id);
            expect(mockRepository.delete).toHaveBeenCalledWith(id);
        });
    });
});
