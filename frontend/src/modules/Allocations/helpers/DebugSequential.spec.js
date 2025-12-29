import { describe, it, expect } from 'vitest'
import { calculateSequentialStartDate } from './estimationHelpers'
import { DATE_TIME_FORMAT_API } from '@/config/constants'

describe('DebugSequential', () => {
    it('correctly identifies the last task for the specific collaborator', () => {
        const brunoId = 'bruno'
        const otherId = 'other'
        const roleId = 'backender'

        // Bruno's Tasks
        // T1: Feb 2 (Mon) -> Feb 4 (Wed)
        const t1 = {
            id: 't1',
            estimations: [{
                role: { id: roleId },
                collaborator: { id: brunoId },
                startDate: '2025-02-02 09:00',
                endDate: '2025-02-04 11:00', // Ends Wed 11:00 (1h left in 9-12 sched)
            }]
        }

        // T2: Assigned to Other
        const t2 = {
            id: 't2',
            estimations: [{
                role: { id: roleId },
                collaborator: { id: otherId },
                startDate: '2025-02-02 09:00',
                endDate: '2025-02-05 18:00',
            }]
        }

        // T3: Assigned to Bruno (Feb 6 Fri -> Feb 10 Tue)
        const t3 = {
            id: 't3',
            estimations: [{
                role: { id: roleId },
                collaborator: { id: brunoId },
                startDate: '2025-02-06 09:00',
                endDate: '2025-02-10 11:00',
            }]
        }

        // T4: Assigned to Other
        const t4 = {
            id: 't4',
            estimations: [{
                role: { id: roleId },
                collaborator: { id: otherId },
                startDate: '2025-02-06 09:00',
                endDate: '2025-02-10 18:00',
            }]
        }

        // Scramble order to simulate unsorted input where T1 comes last in array
        // If logic just picks last element, it will pick T1 (Feb 4) and suggest Feb 6 start.
        const previousTasks = [t3, t4, t2, t1]

        // Collaborator Schedule (for calculating Next Start)
        // Mon-Wed, Fri: 09:00-12:00. Thu: Off.
        const weeklySchedule = {
            monday: { active: true, start: '09:00', end: '12:00' },
            tuesday: { active: true, start: '09:00', end: '12:00' },
            wednesday: { active: true, start: '09:00', end: '12:00' },
            thursday: { active: false, start: '09:00', end: '12:00' },
            friday: { active: true, start: '09:00', end: '12:00' },
            saturday: { active: false },
            sunday: { active: false }
        }

        // Calculate T5 Start
        const result = calculateSequentialStartDate(
            roleId,
            previousTasks,
            '2025-02-01 00:00', // Default start
            brunoId, 
            [], // Blocked dates
            weeklySchedule
        )
        
        console.log('T5 Computed Start:', result.format(DATE_TIME_FORMAT_API))

        // Expected: After T3 (Feb 10 11:00).
        // 11:00 is near 12:00? Yes (>= 11).
        // Should jump to next working day: Feb 11 (Wed) 00:00 (Visual Start).
        
        expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-02-11 00:00')
    })
})
