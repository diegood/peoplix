
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbsenceService } from '../../../src/application/services/AbsenceService.js';

describe('AbsenceService', () => {
    let service;
    let mocks;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks = {
            absence: { 
                findAllTypes: vi.fn(), 
                createType: vi.fn(), 
                updateType: vi.fn(), 
                deleteType: vi.fn(),
                findAbsences: vi.fn(),
                createAbsence: vi.fn(),
                updateStatus: vi.fn(),
                deleteAbsence: vi.fn()
            },
            collaborator: { 
                findById: vi.fn(),
                update: vi.fn()
            },
            workCenter: {
                findById: vi.fn()
            }
        };
        service = new AbsenceService(mocks);
    });

    describe('Absence Types CRUD', () => {
        it('should delegate to repository', async () => {
            await service.getAbsenceTypes();
            expect(mocks.absence.findAllTypes).toHaveBeenCalled();

            const data = { name: 'Sick' };
            await service.createAbsenceType(data);
            expect(mocks.absence.createType).toHaveBeenCalledWith(data);

            await service.updateAbsenceType('id', data);
            expect(mocks.absence.updateType).toHaveBeenCalledWith('id', data);
            
            await service.deleteAbsenceType('id');
            expect(mocks.absence.deleteType).toHaveBeenCalledWith('id');
        });
    });

    describe('Absence Management', () => {
        it('getAbsences delegation', async () => {
            const filters = { collaboratorId: 'c1' };
            await service.getAbsences(filters);
            expect(mocks.absence.findAbsences).toHaveBeenCalledWith(filters);
        });

        it('updateAbsenceStatus delegation', async () => {
            await service.updateAbsenceStatus('id', 'REJECTED');
            expect(mocks.absence.updateStatus).toHaveBeenCalledWith('id', 'REJECTED');
        });

        it('deleteAbsence delegation', async () => {
            await service.deleteAbsence('id');
            expect(mocks.absence.deleteAbsence).toHaveBeenCalledWith('id');
        });
    });

    describe('calculateConsumedDays', () => {
        it('should count weekdays correctly excluding weekends', async () => {
            // Monday to Sunday (7 days total, 2 weekend days -> 5 consumed)
            const start = '2025-01-06'; // Monday
            const end = '2025-01-12';   // Sunday
            
            mocks.collaborator.findById.mockResolvedValue({}); // No work center logic yet

            const days = await service.calculateConsumedDays('col1', start, end);
            expect(days).toBe(5);
        });

        it('should exclude holidays from work center calendar', async () => {
             // Mon-Fri (5 days). One holiday on Wednesday. -> 4 consumed.
             const start = '2025-01-06'; // Monday
             const end = '2025-01-10';   // Friday
             
             mocks.collaborator.findById.mockResolvedValue({ workCenterId: 'wc1' });
             mocks.workCenter.findById.mockResolvedValue({
                 publicHolidayCalendars: [
                     { holidays: [{ date: '2025-01-08' }] } // Wednesday
                 ]
             });

             const days = await service.calculateConsumedDays('col1', start, end);
             expect(days).toBe(4);
        });
    });

    describe('requestAbsence', () => {
        it('should calculate days and create absence', async () => {
            const payload = {
                collaboratorId: 'col1',
                typeId: 'type1',
                startDate: '2025-01-06',
                endDate: '2025-01-06', // 1 day (Mon)
                reason: 'Sick'
            };
            
            mocks.collaborator.findById.mockResolvedValue({});

            await service.requestAbsence(payload);
            
            expect(mocks.absence.createAbsence).toHaveBeenCalledWith(expect.objectContaining({
                daysConsumed: 1,
                status: 'APPROVED'
            }));
        });
    });

    describe('Configuration', () => {
        it('should updateCollaboratorVacationConfig', async () => {
            mocks.collaborator.findById.mockResolvedValue({ vacationDaysPerYear: {} });
            
            await service.updateCollaboratorVacationConfig('col1', 2025, 22);
            
            expect(mocks.collaborator.update).toHaveBeenCalledWith('col1', {
                vacationDaysPerYear: { "2025": 22 }
            });
        });
    });
});
