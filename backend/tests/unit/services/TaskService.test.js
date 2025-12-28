
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../../../src/application/services/TaskService.js';
import dayjs from 'dayjs';

describe('TaskService', () => {
    let service;
    let mockRepository;
    let mockPrisma;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockRepository = {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findById: vi.fn(),
            saveEstimation: vi.fn(),
        };

        mockPrisma = {
            collaborator: { findUnique: vi.fn() },
            task: { findMany: vi.fn() }
        };

        service = new TaskService(mockRepository, mockPrisma);
    });

    // Helper to create a dummy task
    const createDummyTask = (overrides = {}) => ({
        id: 'task-1',
        startDate: new Date('2025-01-01'), // Wednesday
        dependencies: [],
        estimations: [],
        dependents: [],
        ...overrides
    });

    describe('CRUD', () => {
        it('getById', async () => {
            const id = 'task-1';
            await service.getById(id);
            expect(mockRepository.findById).toHaveBeenCalledWith(id);
        });

        it('delete', async () => {
             const id = 'task-1';
             await service.delete(id);
             expect(mockRepository.delete).toHaveBeenCalledWith(id);
        });

        it('create should call recalculateEndDate if task has start date', async () => {
             const input = { startDate: '2025-01-01' };
             const createdTask = createDummyTask();
             mockRepository.create.mockResolvedValue(createdTask);
             mockRepository.findById.mockResolvedValue(createdTask);
             mockRepository.update.mockResolvedValue(createdTask); 

             await service.create(input);

             expect(mockRepository.create).toHaveBeenCalled();
             expect(mockRepository.findById).toHaveBeenCalledWith('task-1');
             expect(mockRepository.update).toHaveBeenCalled();
        });

        it('update should convert dayjs strings and call recalculate if startDate changes', async () => {
             const id = 'task-1';
             const input = { startDate: '2025-01-01 10:00', endDate: '2025-01-02 18:00' };
             const updatedTask = createDummyTask();
             
             mockRepository.update.mockResolvedValue(updatedTask);
             mockRepository.findById.mockResolvedValue(updatedTask); // For recalculate

             await service.update(id, input);
             
             // Verify date conversion
             expect(mockRepository.update).toHaveBeenCalledWith(id, expect.objectContaining({
                 startDate: expect.any(Date),
                 endDate: expect.any(Date)
             }));
             
             // Verify recalculate call
             expect(mockRepository.findById).toHaveBeenCalledWith(id);
        });
        
        it('estimateTask should parse dates and recalculate', async () => {
             const input = { taskId: 't1', roleId: 'r1', hours: 4, startDate: '2025-01-01', endDate: new Date('2025-01-02') };
             const estTask = createDummyTask();
             mockRepository.findById.mockResolvedValue(estTask); // For recalculate and return
             
             await service.estimateTask(input);
             
             expect(mockRepository.saveEstimation).toHaveBeenCalledWith(expect.objectContaining({
                 startDate: expect.any(Date),
                 endDate: expect.any(Date)
             }));
             expect(mockRepository.findById).toHaveBeenCalledWith('t1');
        });
    });

    describe('Dependencies', () => {
        it('addDependency', async () => {
            const t1 = 'task-1';
            const t2 = 'task-2';
            mockRepository.update.mockResolvedValue(createDummyTask());
            mockRepository.findById.mockResolvedValue(createDummyTask());

            await service.addDependency(t1, t2);

            expect(mockRepository.update).toHaveBeenCalledWith(t1, {
                dependencies: { connect: { id: t2 } }
            });
            // Recalculate triggered
            expect(mockRepository.update).toHaveBeenCalledTimes(3); // 1 connect, 2 start/end update in recalc (if flow goes there)
        });

        it('removeDependency', async () => {
            const t1 = 'task-1';
            const t2 = 'task-2';
            mockRepository.update.mockResolvedValue(createDummyTask());
            mockRepository.findById.mockResolvedValue(createDummyTask());

            await service.removeDependency(t1, t2);

            expect(mockRepository.update).toHaveBeenCalledWith(t1, {
                dependencies: { disconnect: { id: t2 } }
            });
        });
    });

    describe('Scheduling Logic (recalculateEndDate)', () => {
        // Base case: 1 day duration (8 hours), Starts Wed Jan 1, Ends Wed Jan 1.
        
        it('should respect weekend skipping (start date)', async () => {
             const task = createDummyTask({
                 startDate: new Date('2025-01-04'), // Saturday
                 estimations: [{ hours: 8 }], // 1 day work
             });

             mockRepository.findById.mockResolvedValue(task);
             
             const updateCalls = [];
             mockRepository.update.mockImplementation((id, data) => {
                 updateCalls.push(data);
                 return Promise.resolve(task);
             });

             await service.recalculateEndDate(task.id);
             
             const startDateUpdate = updateCalls.find(c => c.startDate);
             expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-06');
             
             const endDateUpdate = updateCalls.find(c => c.endDate);
             expect(dayjs(endDateUpdate.endDate).format('YYYY-MM-DD')).toBe('2025-01-06'); 
        });

        it('should respect weekend skipping (duration spans weekend)', async () => {
             const task = createDummyTask({
                 startDate: new Date('2025-01-03'), // Friday
                 estimations: [{ hours: 16 }], // 2 days work
             });
             mockRepository.findById.mockResolvedValue(task);
             
             const updateCalls = [];
             mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });

             await service.recalculateEndDate(task.id);
             
             const endDateUpdate = updateCalls.find(c => c.endDate);
             expect(dayjs(endDateUpdate.endDate).format('YYYY-MM-DD')).toBe('2025-01-06');
        });

        it('should respect dependency chain', async () => {
            const predecessor = {
                id: 'p-1',
                endDate: new Date('2025-01-02') // Thursday
            };

            const task = createDummyTask({
                 startDate: new Date('2025-01-01'), // Initial bad date
                 dependencies: [ predecessor ],
                 estimations: [{ hours: 8 }]
            });
            mockRepository.findById.mockResolvedValue(task);
            
            const updateCalls = [];
            mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });

            await service.recalculateEndDate(task.id);

            const startDateUpdate = updateCalls.find(c => c.startDate);
            expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-03');
        });

        it('should respect collaborator holidays', async () => {
            const task = createDummyTask({
                collaboratorId: 'col-1',
                startDate: new Date('2025-01-01'),
                estimations: [{ hours: 8 }]
            });
            mockRepository.findById.mockResolvedValue(task);

            mockPrisma.collaborator.findUnique.mockResolvedValue({
                id: 'col-1',
                absences: [],
                holidayCalendar: { holidays: ['2025-01-01'] } 
            });
            mockPrisma.task.findMany.mockResolvedValue([]); 

            const updateCalls = [];
            mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });
            
            await service.recalculateEndDate(task.id);
            
            const startDateUpdate = updateCalls.find(c => c.startDate);
            expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-02');
        });
        
         it('should respect collaborator absences', async () => {
            const task = createDummyTask({
                collaboratorId: 'col-1',
                startDate: new Date('2025-01-01'),
                estimations: [{ hours: 8 }]
            });
            mockRepository.findById.mockResolvedValue(task);

            mockPrisma.collaborator.findUnique.mockResolvedValue({
                id: 'col-1',
                absences: [{ startDate: new Date('2025-01-01'), endDate: new Date('2025-01-01') }],
                holidayCalendar: { holidays: [] } 
            });
            mockPrisma.task.findMany.mockResolvedValue([]); 

            const updateCalls = [];
            mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });
            
            await service.recalculateEndDate(task.id);
            
            const startDateUpdate = updateCalls.find(c => c.startDate);
            expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-02');
        });

        it('should respect workCenter holidays', async () => {
            const task = createDummyTask({
                collaboratorId: 'col-1',
                startDate: new Date('2025-01-01'),
                estimations: [{ hours: 8 }]
            });
            mockRepository.findById.mockResolvedValue(task);
            
            mockPrisma.collaborator.findUnique.mockResolvedValue({
                 id: 'col-1',
                 workCenter: {
                     publicHolidayCalendars: [
                         { holidays: [{ date: '2025-01-01' }] } 
                     ]
                 }
            });
            mockPrisma.task.findMany.mockResolvedValue([]); 

            const updateCalls = [];
            mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });
            
            await service.recalculateEndDate(task.id);
            const startDateUpdate = updateCalls.find(c => c.startDate);
            expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-02');
        });

        it('should avoid other tasks (blocked dates)', async () => {
             // Task wants Jan 1. existing task occupies Jan 1.
             const task = createDummyTask({
                collaboratorId: 'col-1',
                startDate: new Date('2025-01-01'),
                estimations: [{ hours: 8 }]
            });
            mockRepository.findById.mockResolvedValue(task);
            
            mockPrisma.collaborator.findUnique.mockResolvedValue({ id: 'col-1' });
            mockPrisma.task.findMany.mockResolvedValue([
                { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-01') }
            ]);

            const updateCalls = [];
            mockRepository.update.mockImplementation((id, data) => { updateCalls.push(data); return Promise.resolve(task); });
            
            await service.recalculateEndDate(task.id);
            const startDateUpdate = updateCalls.find(c => c.startDate);
            expect(dayjs(startDateUpdate.startDate).format('YYYY-MM-DD')).toBe('2025-01-02');
        });

        it('should recursively update dependents', async () => {
             const task = createDummyTask({
                 dependents: [{ id: 'd1' }]
             });
             mockRepository.findById.mockResolvedValue(task); // First call returns parent
             
             // Dependent task needs to be returned on second call (recursion)
             // But repository.findById is mocked globally.
             // We can use mockImplementationOnce sequence.
             mockRepository.findById
                .mockResolvedValueOnce(task) // Parent check
                .mockResolvedValueOnce(createDummyTask({ id: 'd1' })); // Child check
             
             await service.recalculateEndDate(task.id);
             
             // Expect recursive call for d1
             expect(mockRepository.findById).toHaveBeenCalledWith('d1');
        });
    });
});
