import { describe, it, expect, vi } from 'vitest'
import dayjs from '@/config/dayjs'
import { addWorkingDays, calculateEstimation } from '../estimationHelpers'
import { DATE_FORMAT_API, DATE_TIME_FORMAT_API } from '@/config/constants'

// Mock dependencies if needed, or rely on pure function logic
// estimationHelpers imports 'dayjs', 'helper/Date'
// We might need to mock helper/Date if it has complex logic, but it seems to rely on pure inputs mostly.
// However, findRoundRobinCollaborator etc are imported.
// For addWorkingDays, it is pure.

describe('estimationHelpers', () => {
    describe('calculateEstimation', () => {
        const mockTasks = [
            { id: 't1', estimations: [{ role: { id: 'r1' }, startDate: '2026-01-05', endDate: '2026-01-05', collaborator: { id: 'c1' } }] }
        ]
        const mockAllocations = [{
            collaborator: { id: 'c1' },
            roles: [{ id: 'r1' }]
        }]

        it('uses existing start date if present (update scenario)', () => {
            const result = calculateEstimation({
                roleId: 'r1',
                hours: 8,
                taskIndex: 0,
                allTasks: [],
                wpStartDateFormatted: '2026-01-05',
                projectAllocations: mockAllocations,
                recurrentEvents: [],
                existingEstimation: { startDate: '2026-01-10', collaborator: { id: 'c1' } }
            })
            
            // Should preserve 2026-01-10 even if WP starts on Jan 05
            expect(result.startDate.format(DATE_FORMAT_API)).toBe('2026-01-10')
        })

        it('prioritizes forceStartDate (e.g. from Gantt move)', () => {
             const result = calculateEstimation({
                roleId: 'r1',
                hours: 8,
                taskIndex: 0,
                allTasks: [],
                wpStartDateFormatted: '2026-01-05',
                projectAllocations: mockAllocations,
                recurrentEvents: [],
                existingEstimation: { startDate: '2026-01-10', collaborator: { id: 'c1' } },
                forceStartDate: dayjs('2026-01-15')
            })
            expect(result.startDate.format(DATE_FORMAT_API)).toBe('2026-01-15')
        })

        it('calculates sequential start date for new task', () => {
            // If T1 ends Jan 05 18:00.
            const t1End = '2026-01-05 18:00'
            mockTasks[0].estimations[0].endDate = t1End
            
             const result = calculateEstimation({
                roleId: 'r1',
                hours: 8,
                taskIndex: 1, // Second task
                allTasks: mockTasks,
                wpStartDateFormatted: '2026-01-01',
                projectAllocations: mockAllocations,
                recurrentEvents: []
            })
            
            // Should start next day
            expect(result.startDate.format(DATE_FORMAT_API)).toBe('2026-01-06')
        })
    })

    describe('addWorkingDays', () => {
        it('calculates end date for 8h task with 1h daily recurrent event (9-18 schedule)', () => {
            // Schedule: 09:00 - 18:00 (9h span). 
            // 9h span > 8h => Lunch deduction = 1h.
            // Daily Capacity = 9 - 1 = 8h.
            // Recurrent Event: 1h Daily.
            // Effective Capacity = 8 - 1 = 7h.
            
            // Task: 8h.
            // Start: Monday 09:00.
            // Day 1: 7h capacity. Remaining 1h.
            // Day 2: Spills over.
            
            const start = dayjs('2026-01-05T09:00:00') // Monday
            const hours = 8
            const blockedDates = []
            const daySched = { active: true, start: '09:00', end: '18:00' }
            const schedule = {
                monday: daySched, tuesday: daySched, wednesday: daySched, thursday: daySched, friday: daySched,
                saturday: { active: false }, sunday: { active: false }
            }
            const recurrentEvents = [{
                type: 'DAILY',
                hours: 1,
                startDate: '1767225600000' // Dec 30 2025
            }]

            const result = addWorkingDays(start, hours, blockedDates, schedule, recurrentEvents)
            
            // Expected:
            // Day 1 (Jan 5): Used 7h. Remaining 1h.
            // Day 2 (Jan 6): Holiday? No blocked dates passed here. So Jan 6 is Work Day.
            // Day 2 Capacity: 7h.
            // Task needs 1h.
            // End Time: 09:00 + 1h (work) + 1h (event) = 11:00.
            
            expect(result.format(DATE_TIME_FORMAT_API)).toBe('2026-01-06 11:00')
        })

        it('handles specific end time correctly when multiple days needed', () => {
            // 20h task. 7h daily capacity.
            // Day 1: 7h. Rem 13.
            // Day 2: 7h. Rem 6.
            // Day 3: Needs 6h.
            // End Time: 09:00 + 6h + 1h (event) = 16:00.
            
            const start = dayjs('2026-01-05T09:00:00')
            const hours = 20
            const daySched = { active: true, start: '09:00', end: '18:00' }
            const schedule = {
                monday: daySched, tuesday: daySched, wednesday: daySched, thursday: daySched, friday: daySched
            }
            const recurrentEvents = [{
                type: 'DAILY',
                hours: 1,
                startDate: '1767225600000'
            }]
            
            const result = addWorkingDays(start, hours, [], schedule, recurrentEvents)
            // Day 1: Jan 5.
            // Day 2: Jan 6.
            // Day 3: Jan 7.
            expect(result.format(DATE_TIME_FORMAT_API)).toBe('2026-01-07 16:00')
        })

        it('handles partial day start (Start at 14:00)', () => {
            // Start 14:00. Schedule 09:00-18:00.
            // Day 1 Capacity: 18 - 14 = 4h.
            // Lunch deduction? 
            // Logic: if totalSpan > 8 (yes, 9) AND startHour < 14.
            // Start is 14. 14 < 14 False. No lunch deduction.
            // Capacity = 4h.
            // Recurrent Event: 1h.
            // Effective: 3h.
            
            // Task 8h.
            // Day 1: Uses 3h. Remaining 5h.
            // Day 2 (Jan 6): Full day. 09:00 Start.
            // Capacity: 9 - 1(lunch) - 1(event) = 7h.
            // Needs 5h.
            // End Time: 09:00 + 5h + 1h(event) = 15:00.
            
            const start = dayjs('2026-01-05T14:00:00')
            const hours = 8
            const daySched = { active: true, start: '09:00', end: '18:00' }
            const schedule = {
                monday: daySched, tuesday: daySched, wednesday: daySched, thursday: daySched, friday: daySched
            }
             const recurrentEvents = [{
                type: 'DAILY',
                hours: 1,
                startDate: '1767225600000'
            }]
            
            const result = addWorkingDays(start, hours, [], schedule, recurrentEvents)
            expect(result.format(DATE_TIME_FORMAT_API)).toBe('2026-01-06 15:00')
        })

        it('handles blocked dates (Holidays)', () => {
            // Task 8h. Eff Cap 7h.
            // Start Jan 5.
            // Jan 6 Blocked.
            // Should finish Jan 7.
            const start = dayjs('2026-01-05T09:00:00')
            const hours = 8
            const blockedDates = ['2026-01-06']
            const schedule = {
                monday: { active: true, start: '09:00', end: '18:00' },
                tuesday: { active: true, start: '09:00', end: '18:00' },
                wednesday: { active: true, start: '09:00', end: '18:00' },
                thursday: { active: true, start: '09:00', end: '18:00' },
                friday: { active: true, start: '09:00', end: '18:00' },
            }
            const recurrentEvents = [{ type: 'DAILY', hours: 1, startDate: '1767225600000' }]
            
            const result = addWorkingDays(start, hours, blockedDates, schedule, recurrentEvents)
            // Jan 5: 7h. Rem 1.
            // Jan 6: Blocked.
            // Jan 7: Needs 1h. End 11:00.
            expect(result.format(DATE_TIME_FORMAT_API)).toBe('2026-01-07 11:00')
        })
    })
})
