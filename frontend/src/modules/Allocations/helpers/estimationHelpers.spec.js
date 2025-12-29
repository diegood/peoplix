import { describe, it, expect } from 'vitest'
import { calculateSequentialStartDate } from './estimationHelpers'
import dayjs from '@/config/dayjs'
import { DATE_TIME_FORMAT_API } from '@/config/constants'

describe('estimationHelpers', () => {
    describe('calculateSequentialStartDate', () => {
        it('returns next day start if previous task ends near end of day (Sequential check)', () => {
            const roleId = 'r1'
            const collaboratorId = 'c1'
            
            const prevTask = {
                estimations: [{
                    role: { id: roleId },
                    collaborator: { id: collaboratorId },
                    endDate: '2025-01-08 17:00', // Wednesday
                }]
            }
            
            
            const result = calculateSequentialStartDate(
                roleId, 
                [prevTask], 
                '2025-01-01', 
                collaboratorId, 
                [], 
                null // Default schedule
            )
            
            console.log('Result:', result.format(DATE_TIME_FORMAT_API))
            
            // Now it should return 2025-01-09 00:00 (Visual Start of Day)
            expect(result.format(DATE_TIME_FORMAT_API)).toBe('2025-01-09 00:00') 
        })
    })
})
