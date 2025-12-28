import { PrismaTaskRepository } from '../../infrastructure/repositories/PrismaTaskRepository.js'
import { prisma } from '../../infrastructure/database/client.js'
import dayjs from 'dayjs'

export class TaskService {
    constructor(repository, prismaClient) {
        this.repository = repository || new PrismaTaskRepository()
        this.prisma = prismaClient || prisma
    }

    async getById(id) {
        return this.repository.findById(id)
    }

    async create(data) {
        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }
        const task = await this.repository.create(data)
        if (task.startDate) {
            await this.recalculateEndDate(task.id)
        }
        return this.repository.findById(task.id)
    }

    async update(id, data) {
        if (data.startDate) {
             data.startDate = dayjs(data.startDate, 'YYYY-MM-DD HH:mm').toDate()
        }
        if(data.endDate) {
            data.endDate = dayjs(data.endDate, 'YYYY-MM-DD HH:mm').toDate()
        }
        const task = await this.repository.update(id, data)
        if (data.startDate) {
            await this.recalculateEndDate(task.id)
        }
        return task
    }

    async delete(id) {
        return this.repository.delete(id)
    }

    async estimateTask({ taskId, roleId, hours, startDate, endDate, collaboratorId }) {

        const payload = { taskId, roleId, hours }
        
        const parseDate = (d) => {
            if (!d) return undefined
            if (d instanceof Date) return d
            if (typeof d === 'string' && /^\d+$/.test(d)) {
                return new Date(parseInt(d))
            }
            return new Date(d)
        }

        if (startDate) payload.startDate = parseDate(startDate)
        if (endDate) payload.endDate = parseDate(endDate)
        if (collaboratorId) payload.collaboratorId = collaboratorId
        
        await this.repository.saveEstimation(payload)
        await this.recalculateEndDate(taskId)
        return this.repository.findById(taskId)
    }
    
    async addDependency(taskId, predecessorId) {
        await this.repository.update(taskId, {
            dependencies: {
                connect: { id: predecessorId }
            }
        })
        
        await this.recalculateEndDate(taskId)
        return this.repository.findById(taskId)
    }

    async removeDependency(taskId, predecessorId) {
        await this.repository.update(taskId, {
            dependencies: {
                disconnect: { id: predecessorId }
            }
        })
        await this.recalculateEndDate(taskId)
        return this.repository.findById(taskId)
    }

    async recalculateEndDate(taskId) {
        const task = await this.repository.findById(taskId)
        
        let calculatedStartDate = task.startDate ? dayjs(task.startDate) : null
        
        if (task.dependencies && task.dependencies.length > 0) {
             const predecessorEndDates = task.dependencies.map(d => d.endDate ? dayjs(d.endDate) : null).filter(d => d)
             if (predecessorEndDates.length > 0) {
                 const maxEnd = predecessorEndDates.reduce((max, d) => d.isAfter(max) ? d : max, predecessorEndDates[0])
                 
                 let nextDay = maxEnd.add(1, 'day')
                 while (nextDay.day() === 0 || nextDay.day() === 6) {
                     nextDay = nextDay.add(1, 'day')
                 }
                 calculatedStartDate = nextDay
             }
        }

        if (!calculatedStartDate) {
            return
        }

        const blockedDates = new Set()
         if (task.collaboratorId) {
             const col = await this.prisma.collaborator.findUnique({
                 where: { id: task.collaboratorId },
                 include: {
                     absences: { include: { type: true } },
                     holidayCalendar: true,
                     workCenter: { include: { publicHolidayCalendars: { include: { holidays: true } } } }
                 }
             })

             if (col) {
                 if (col.absences) {
                     col.absences.forEach(a => {
                         let d = dayjs(a.startDate)
                         const end = dayjs(a.endDate)
                         while (d.isBefore(end) || d.isSame(end, 'day')) {
                             blockedDates.add(d.format('YYYY-MM-DD'))
                             d = d.add(1, 'day')
                         }
                     })
                 }
                 let holidays = []
                 if (col.holidayCalendar && col.holidayCalendar.holidays) {
                     let hList = col.holidayCalendar.holidays
                     try {
                        if (typeof hList === 'string') hList = JSON.parse(hList)
                     } catch(e) {}
                     if (Array.isArray(hList)) holidays = [...holidays, ...hList]
                 }
                 if (col.workCenter && col.workCenter.publicHolidayCalendars) {
                     col.workCenter.publicHolidayCalendars.forEach(cal => {
                        if (cal.holidays && Array.isArray(cal.holidays)) {
                            holidays = [...holidays, ...cal.holidays]
                        }
                     })
                 }
                 holidays.forEach(h => blockedDates.add(h.date || h))

                 const otherTasks = await this.prisma.task.findMany({
                     where: {
                         collaboratorId: task.collaboratorId,
                         id: { not: taskId },
                         endDate: { gte: calculatedStartDate.toISOString() } 
                     }
                 })
                 
                 otherTasks.forEach(t => {
                     if (t.startDate && t.endDate) {
                         let d = dayjs(t.startDate)
                         const end = dayjs(t.endDate)
                         while (d.isBefore(end) || d.isSame(end, 'day')) {
                             blockedDates.add(d.format('YYYY-MM-DD'))
                             d = d.add(1, 'day')
                         }
                     }
                 })
             }
        }
        
        while (calculatedStartDate.day() === 0 || calculatedStartDate.day() === 6 || blockedDates.has(calculatedStartDate.format('YYYY-MM-DD'))) {
             calculatedStartDate = calculatedStartDate.add(1, 'day')
        }
        
        await this.repository.update(taskId, { startDate: calculatedStartDate.toDate() })


        const hoursPerRole = task.estimations.map(e => e.hours)
        const maxHours = hoursPerRole.length > 0 ? Math.max(...hoursPerRole) : 0
        
        const daysNeeded = Math.ceil(maxHours / 8)

        let endDate = calculatedStartDate.clone()
        
        if (daysNeeded > 0) {
            for (let i = 1; i < daysNeeded; i++) {
                 endDate = endDate.add(1, 'day')
                 while (endDate.day() === 0 || endDate.day() === 6 || blockedDates.has(endDate.format('YYYY-MM-DD'))) {
                     endDate = endDate.add(1, 'day')
                 }
            }
        }
        
        await this.repository.update(taskId, { endDate: endDate.toDate() })
        
        if (task.dependents && task.dependents.length > 0) {
            for (const dep of task.dependents) {
                await this.recalculateEndDate(dep.id)
            }
        }
    }
}
