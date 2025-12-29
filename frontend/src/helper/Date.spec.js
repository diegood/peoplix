import { describe, it, expect } from 'vitest'
import dayjs from '@/config/dayjs' // Import configured dayjs with plugins
import { addWorkingDays } from './Date'
import { DATE_TIME_FORMAT_API, DATE_FORMAT_API } from '@/config/constants'

describe('Date Helper - addWorkingDays (Capacity Based)', () => {
    
    // Default Schedule: Mon-Fri 09:00 - 17:00 (8 hours)
    const defaultSchedule = null 

    it('should calculate end date for a task fitting in a single day', () => {
        // Mon 09:00, 4 hours -> Mon 13:00
        const start = '2025-01-06 09:00' // Monday
        const duration = 4
        
        const result = addWorkingDays(start, duration, [], defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-06 13:00')
    })

    it('should calculate end date for a task exactly filling a day', () => {
        // Mon 09:00, 8 hours -> Mon 17:00
        const start = '2025-01-06 09:00'
        const duration = 8
        
        const result = addWorkingDays(start, duration, [], defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-06 17:00')
    })

    it('should split task across multiple days (Standard)', () => {
        // Mon 09:00, 10 hours 
        // -> Mon: 8h (ends 17:00)
        // -> Tue: 2h (starts 09:00, ends 11:00)
        const start = '2025-01-06 09:00'
        const duration = 10
        
        const result = addWorkingDays(start, duration, [], defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-07 11:00')
    })

    it('should skip weekends', () => {
        // Fri 09:00, 10 hours
        // -> Fri: 8h (ends 17:00)
        // -> Sat/Sun skip
        // -> Mon: 2h (starts 09:00, ends 11:00)
        const start = '2025-01-10 09:00' // Friday
        const duration = 10
        
        const result = addWorkingDays(start, duration, [], defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-13 11:00') // Monday
    })

    it('should correct start time if before default start (00:00 -> 09:00)', () => {
        // The fix user requested:
        // Start Mon 00:00, 18 hours
        // -> Jump to Mon 09:00
        // -> Mon: 8h (rem 10)
        // -> Tue: 8h (rem 2)
        // -> Wed: 2h (ends 11:00)
        const start = '2025-01-06 00:00'
        const duration = 18
        
        const result = addWorkingDays(start, duration, [], defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-08 11:00')
    })

    it('should handle custom reduced schedule', () => {
        // Custom Schedule: Friday is short (4 hours: 09:00-13:00)
        const customSchedule = {
            monday: { active: true, start: '09:00', end: '17:00' },
            tuesday: { active: true, start: '09:00', end: '17:00' },
            wednesday: { active: true, start: '09:00', end: '17:00' },
            thursday: { active: true, start: '09:00', end: '17:00' },
            friday: { active: true, start: '09:00', end: '13:00' }, // Short day
            saturday: { active: false },
            sunday: { active: false }
        }

        // Start Fri 09:00, 8 hours task
        // -> Fri capacity: 4h (ends 13:00). Remaining: 4h.
        // -> Sat/Sun skip
        // -> Mon capacity: 8h. Use 4h (starts 09:00, ends 13:00)
        const start = '2025-01-10 09:00' // Friday
        const duration = 8
        
        const result = addWorkingDays(start, duration, [], customSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-13 13:00')
    })

    it('should handle blocked dates (holidays)', () => {
        // Mon 09:00, 8 hours. Tue is blocked.
        // -> Mon: 8h (ends 17:00). Task done.
        // Wait, let's make it spill over.
        // Mon 09:00, 12 hours. Tue is blocked.
        // -> Mon: 8h. Rem 4h.
        // -> Tue: Blocked.
        // -> Wed: 4h (ends 13:00)
        const start = '2025-01-06 09:00'
        const duration = 12
        const blockedDates = ['2025-01-07'] // Tuesday
        
        const result = addWorkingDays(start, duration, blockedDates, defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-08 13:00')
    })
    
     it('should handle starting on a blocked day', () => {
        // Start Tue 09:00 (Blocked), 8 hours.
        // -> Skip Tue.
        // -> Wed: 8h. Ends Wed 17:00
        const start = '2025-01-07 09:00'
        const duration = 8
        const blockedDates = ['2025-01-07']
        
        const result = addWorkingDays(start, duration, blockedDates, defaultSchedule)
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-08 17:00')
    })
})
