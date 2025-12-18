import { PrismaTaskRepository } from '../../infrastructure/repositories/PrismaTaskRepository.js'
import dayjs from 'dayjs'

export class TaskService {
    constructor() {
        this.repository = new PrismaTaskRepository()
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
        console.log(`[TaskService] estimateTask: taskId=${taskId} roleId=${roleId} hours=${hours} coll=${collaboratorId}`)
        console.log(`[TaskService] Dates: start=${startDate} (${typeof startDate}), end=${endDate} (${typeof endDate})`)

        const payload = { taskId, roleId, hours }
        
        const parseDate = (d) => {
            if (!d) return undefined
            if (d instanceof Date) return d
            // If string contains only digits, treat as timestamp
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
                 await this.repository.update(taskId, { startDate: calculatedStartDate.toDate() })
             }
        }

        if (!calculatedStartDate) return

        
        const hoursPerRole = task.estimations.map(e => e.hours)
        const maxHours = hoursPerRole.length > 0 ? Math.max(...hoursPerRole) : 0
        
        const daysNeeded = Math.ceil(maxHours / 8)
        let endDate = calculatedStartDate.clone()
        
        if (daysNeeded > 0) {
            let addedDays = 0
            let daysToProcess = daysNeeded
            for (let i = 1; i < daysNeeded; i++) {
                 endDate = endDate.add(1, 'day')
                 while (endDate.day() === 0 || endDate.day() === 6) {
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
