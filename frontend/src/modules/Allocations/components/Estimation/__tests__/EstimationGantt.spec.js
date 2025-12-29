import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import EstimationGantt from '../EstimationGantt.vue'
import dayjs from '@/config/dayjs'
import { DATE_TIME_FORMAT_API } from '@/config/constants'

// Mock GGantt components 
vi.mock('hy-vue-gantt', () => ({
    GGanttChart: {
        name: 'GGanttChart',
        template: '<div><slot /></div>',
        props: ['chartStart', 'chartEnd'] 
    },
    GGanttRow: {
        name: 'GGanttRow',
        template: '<div></div>',
        props: ['bars', 'label', 'children', 'id', 'highlight-on-hover']
    }
}))

describe('EstimationGantt.vue', () => {
    const mockProject = {
        requiredRoles: [
            { role: { id: 'role1', name: 'Developer' } }
        ],
        allocations: [
            { 
                roles: [{ id: 'role1' }],
                collaborator: {
                    id: 'col1',
                    firstName: 'John',
                    lastName: 'Doe',
                    workingSchedule: null,
                    absences: [
                         { id: 'abs1', startDate: '2025-01-20', endDate: '2025-01-21', type: { name: 'Holiday' } }
                    ],
                    holidayCalendar: { holidays: [] },
                    workCenter: { publicHolidayCalendars: [] }
                }
            }
        ]
    }

    const mockWorkPackages = [
        {
            id: 'wp1',
            name: 'Frontend',
            startDate: '2025-01-01',
            tasks: [
                {
                    id: 'task1',
                    name: 'Login',
                    estimations: [
                        { role: { id: 'role1' }, hours: 8, collaborator: { id: 'col1' }, startDate: '2025-01-06 09:00', endDate: '2025-01-06 17:00' }
                    ]
                }
            ]
        }
    ]

    const mountComponent = (props = {}) => {
        return mount(EstimationGantt, {
            props: {
                project: mockProject,
                workPackages: mockWorkPackages,
                ...props
            }
            // Removing stubs to rely on vi.mock
        })
    }

    it('renders correct number of rows', () => {
        const wrapper = mountComponent()
        const rows = wrapper.findAllComponents({ name: 'GGanttRow' })
        expect(rows.length).toBe(1) // 1 WorkPackage row
        expect(rows[0].props('label')).toBe('Frontend')
        
        const children = rows[0].props('children')
        expect(children.length).toBe(1) // 1 Role row
        expect(children[0].label).toContain('Developer - John Doe')
    })

    it('generates task bars correctly', () => {
        const wrapper = mountComponent()
        const rows = wrapper.findAllComponents({ name: 'GGanttRow' })
        
        const children = rows[0].props('children')
        const bars = children[0].bars

        const taskBar = bars.find(b => b.label === 'Login')
        expect(taskBar).toBeDefined()
        expect(taskBar.from).toContain('2025-01-06 09:00')
        expect(taskBar.to).toContain('2025-01-06 23:59')
    })
    
    it('generates vacation bars correctly', () => {
        const wrapper = mountComponent()
        const rows = wrapper.findAllComponents({ name: 'GGanttRow' })
        
        const children = rows[0].props('children')
        const bars = children[0].bars
        
        const vacBar = bars.find(b => b.label === 'Vacaciones')
        expect(vacBar).toBeDefined()
        expect(vacBar.from).toContain('2025-01-20')
    })

    it('handles bar drag end correctly', async () => {
        const wrapper = mountComponent()
        
        const event = {
            bar: {
                ganttBarConfig: { id: 'task1|role1' },
                from: '2025-01-08 09:00' 
            }
        }
        
        const chart = wrapper.findComponent({ name: 'GGanttChart' })
        await chart.vm.$emit('dragend-bar', event)

        const emitted = wrapper.emitted('update-task-date')
        expect(emitted).toBeTruthy()
        const payload = emitted[0][0]
        
        expect(payload.startDate).toContain('2025-01-08 09:00') 
        expect(payload.endDate).toContain('2025-01-08 17:00') 
        expect(payload.taskId).toBe('task1')
        expect(payload.hours).toBe(8)
    })

    it('renders full day task (8h) as full visual day (00:00 -> 23:59 approx) even with persisted data', () => {
        const wrapper = mountComponent({
             workPackages: [{
                id: 'wp2',
                name: 'VisualTest',
                startDate: '2025-01-06',
                tasks: [{
                    id: 't1',
                    name: 'FullDayTask',
                    estimations: [
                        { role: { id: 'role1' }, hours: 8, collaborator: { id: 'col1' }, startDate: '2025-01-06 00:00', endDate: '2025-01-06 17:00' }
                    ]
                }]
             }]
        })
        
        const rows = wrapper.findAllComponents({ name: 'GGanttRow' })
        const children = rows[0].props('children')
        const bars = children[0].bars
        const bar = bars.find(b => b.label === 'FullDayTask')
        
        expect(bar.from).toContain('2025-01-06 00:00')
        const isEndOfDay = bar.to.includes('2025-01-06 23:59') || bar.to.includes('2025-01-07 00:00')
        expect(isEndOfDay).toBe(true) 
    })
    it('prevents overlap when dragging task', async () => {
        const wrapper = mountComponent({
             workPackages: [{
                id: 'wp3',
                name: 'OverlapTest',
                startDate: '2025-01-06',
                tasks: [
                    {
                        id: 'tA',
                        name: 'TaskA',
                        estimations: [
                            { role: { id: 'role1' }, hours: 4, collaborator: { id: 'col1' }, startDate: '2025-01-06 09:00', endDate: '2025-01-06 13:00' }
                        ]
                    },
                    {
                        id: 'tB',
                        name: 'TaskB',
                        estimations: [
                            { role: { id: 'role1' }, hours: 4, collaborator: { id: 'col1' }, startDate: '2025-01-07 09:00', endDate: '2025-01-07 13:00' }
                        ]
                    }
                ]
             }]
        })
        
        // Drag TaskB to 2025-01-06 10:00 (Overlapping TaskA which ends at 13:00)
        const event = {
            bar: {
                ganttBarConfig: { id: 'tB|role1' },
                from: '2025-01-06 10:00' 
            }
        }
        
        const chart = wrapper.findComponent({ name: 'GGanttChart' })
        await chart.vm.$emit('dragend-bar', event)

        const emitted = wrapper.emitted('update-task-date')
        expect(emitted).toBeTruthy()
        const payload = emitted[0][0]
        
        // Expectation: It should NOT be 10:00.
        // It should snap to TaskA End (13:00) or check availability.
        // Let's expect 13:00 (End of Task A)
        expect(payload.startDate).toContain('2025-01-06 13:00')
    })
})
