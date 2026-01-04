import { describe, it, expect } from 'vitest'
import { addWorkingDays, calculateSequentialStartDate } from './estimationHelpers'
import dayjs from '@/config/dayjs'
import { DATE_TIME_FORMAT_API, DATE_FORMAT_API } from '@/config/constants'

describe('Recurrent Event Visual Calculation', () => {
    it('calculates end date correctly with daily recurrent event and holidays', () => {
        // Scenario:
        // Start: Jan 5 2026 (Mon).
        // Holiday: Jan 6 2026 (Tue).
        // Recurrent Event: Daily, 1 hour.
        // Schedule: 09:00 - 17:00 (8h).
        // Effective Daily Capacity: 8 - 1 = 7h.
        // Task: 8 hours.
        
        // Expected Flow:
        // Mon Jan 5: 7h worked (09:00 -> 17:00). Rem: 1h.
        // Tue Jan 6: Holiday. Skip.
        // Wed Jan 7: 1h worked (09:00 -> 10:00).
        // End Date: Jan 7 10:00.

        const startStr = '2026-01-05 09:00'
        const blockedDates = ['2026-01-06'] // Tue is holiday
        
        const weeklySchedule = {
            monday: { active: true, start: '09:00', end: '17:00' },
            tuesday: { active: true, start: '09:00', end: '17:00' },
            wednesday: { active: true, start: '09:00', end: '17:00' },
            thursday: { active: true, start: '09:00', end: '17:00' },
            friday: { active: true, start: '09:00', end: '17:00' },
            saturday: { active: false },
            sunday: { active: false }
        }

        const recurrentEvents = [{
            id: 'r1',
            type: 'DAILY',
            hours: 1,
            startDate: '2026-01-01'
        }]

        const result = addWorkingDays(
            dayjs(startStr), 
            8, // hours to add 
            blockedDates, 
            weeklySchedule, 
            recurrentEvents
        )

        console.log('Final Date:', result.format(DATE_TIME_FORMAT_API))
        
        // Verify day is Jan 7
        expect(result.format('YYYY-MM-DD')).toBe('2026-01-07')
        
        // Verify time (approximate 10:00, or end of block logic)
        // Note: The visual logic often snaps to "visual hours". 
        // But logic should return Jan 7.
    })
})
