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
             data.startDate = new Date(data.startDate)
        }
        const task = await this.repository.update(id, data)
        // If start date changed, recalc this task.
        if (data.startDate) {
            await this.recalculateEndDate(task.id)
        }
        return task
    }

    async delete(id) {
        return this.repository.delete(id)
    }

    async estimateTask({ taskId, roleId, hours }) {
        await this.repository.saveEstimation({ taskId, roleId, hours })
        await this.recalculateEndDate(taskId)
        return this.repository.findById(taskId)
    }
    
    async addDependency(taskId, predecessorId) {
        // Add dependency at repo/DB level
        await this.repository.update(taskId, {
            dependencies: {
                connect: { id: predecessorId }
            }
        })
        
        // Trigger calculation (Dependency implies constraint on StartDate)
        // If Predecessor finishes on date X, Dependent must start >= X.
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
        
        // Dependency logic:
        // Check dependencies to determine min Start Date.
        // If task has explicit startDate set by user, should we override it?
        // User said: "el startDate sera un requisito... si no, se tendra que calcular".
        // Let's assume:
        // 1. If Dependencies exist, start date is Max(Predecessors.endDate).
        // 2. If no Dependencies, use `task.startDate` (manual).
        
        let calculatedStartDate = task.startDate ? dayjs(task.startDate) : null
        
        if (task.dependencies && task.dependencies.length > 0) {
             const predecessorEndDates = task.dependencies.map(d => d.endDate ? dayjs(d.endDate) : null).filter(d => d)
             if (predecessorEndDates.length > 0) {
                 // Max end date
                 const maxEnd = predecessorEndDates.reduce((max, d) => d.isAfter(max) ? d : max, predecessorEndDates[0])
                 
                 // Start next working day? Or same day if previous ends early? 
                 // Simple: Next day.
                 let nextDay = maxEnd.add(1, 'day')
                 // Skip weekend
                 while (nextDay.day() === 0 || nextDay.day() === 6) {
                     nextDay = nextDay.add(1, 'day')
                 }
                 calculatedStartDate = nextDay
                 
                 // Update the task's start date
                 await this.repository.update(taskId, { startDate: calculatedStartDate.toDate() })
             }
        }

        if (!calculatedStartDate) return

        // Duration Calculation
        // User: "las tareas que resuelven otros roles podran hacerse de forma paralela"
        // Meaning: If Front=4h, Back=4h -> Max is 4h. Duration = 4h.
        // If Front=10h, Back=2h -> Max is 10h. Duration = 10h.
        
        const hoursPerRole = task.estimations.map(e => e.hours)
        const maxHours = hoursPerRole.length > 0 ? Math.max(...hoursPerRole) : 0
        
        // But what if multiple people on same role?
        // "Front: 4h" -> 1 Front dev? Or 4h total effort?
        // Usually "4h" means effort.
        // Assuming 1 resource per role per task for simplicity (since we assign "a collaborator" to task?? Or maybe not yet?).
        // User said earlier "asignar a un colaborador" -> singular.
        // If specific collaborator assigned, capacity is 1.
        // If not assigned, assume 1 generic resource per role.
        // So Duration = Max(RoleHours) / 8.
        
        const daysNeeded = Math.ceil(maxHours / 8)
        let endDate = calculatedStartDate.clone()
        
        if (daysNeeded > 0) {
            let addedDays = 0
            // If needs 1 day (e.g. 4h), end date is same day? Or end of day?
            // If needs 8h -> 1 day. Start Monday -> End Monday.
            // If needs 16h -> 2 days. Start Monday -> End Tuesday.
            // Formula: EndDate = StartDate + (DaysNeeded - 1) working days.
            // If DaysNeeded = 0 (0 hours), End = Start.
            
            // Correction for 0-indexed summation
            let daysToProcess = daysNeeded
             // If 4h (0.5 days) -> Math.ceil = 1.
             // Loop should run for (days - 1) adds?
             // Mon + 0 days = Mon. Correct.
             
             // Loop logic:
             // We start at day 0 (StartDate).
             // We need to cover (DaysNeeded) working days.
             // We consume 1st day immediately.
             
             // Wait, previous logic was:
             // while (addedDays < daysNeeded) { endDate.add(1 day) ... }
             // If daysNeeded = 1. addedDays=0. Add 1 day. End = Tue.
             // Mon -> Tue implies 2 days span or end of Tue?
             // Usually Gantt: [Start, End]. Inclusive.
             // If 1 day task: Start=Mon, End=Mon.
             // My loop added 1 day for 1 day task -> End=Tue.
             
             // Fix: We need to find the date of the Nth working day.
             // N = daysNeeded.
             // If N=1, result = StartDate.
             // If N=2, result = StartDate + 1 working day.
             
            for (let i = 1; i < daysNeeded; i++) {
                 endDate = endDate.add(1, 'day')
                 while (endDate.day() === 0 || endDate.day() === 6) {
                     endDate = endDate.add(1, 'day')
                 }
            }
        }
        
        await this.repository.update(taskId, { endDate: endDate.toDate() })
        
        // Trigger Propagated Recalculation (Successors)
        if (task.dependents && task.dependents.length > 0) {
            for (const dep of task.dependents) {
                await this.recalculateEndDate(dep.id)
            }
        }
    }
}
