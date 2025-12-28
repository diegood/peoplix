
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkCenterService } from '../../../src/application/services/WorkCenterService.js';

describe('WorkCenterService', () => {
    let service;
    let mockRepository;
    let mockHolidayApi;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepository = {
            findAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            savePublicHolidayCalendar: vi.fn(),
            findPublicHolidayCalendars: vi.fn(),
        };
        mockHolidayApi = {
            fetchPublicHolidays: vi.fn(),
        };
        service = new WorkCenterService(mockRepository, mockHolidayApi);
    });

    it('CRUD Delegation', async () => {
        await service.getAll();
        expect(mockRepository.findAll).toHaveBeenCalled();

        const data = { name: 'center' };
        await service.create(data);
        expect(mockRepository.create).toHaveBeenCalledWith(data);

        await service.update('wc1', data);
        expect(mockRepository.update).toHaveBeenCalledWith('wc1', data);
        
        await service.delete('wc1');
        expect(mockRepository.delete).toHaveBeenCalledWith('wc1');
    });

    it('importPublicHolidays delegation', async () => {
        await service.importPublicHolidays(2025, 'ES', 'AN');
        expect(mockHolidayApi.fetchPublicHolidays).toHaveBeenCalledWith(2025, 'ES', 'AN');
    });

    it('Holiday Calendar management delegation', async () => {
        const data = { name: 'Cal' };
        await service.savePublicHolidayCalendar(data);
        expect(mockRepository.savePublicHolidayCalendar).toHaveBeenCalledWith(data);

        await service.getPublicHolidayCalendars('wc1');
        expect(mockRepository.findPublicHolidayCalendars).toHaveBeenCalledWith('wc1');
    });
});
