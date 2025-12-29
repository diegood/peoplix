import dayjs from '@/config/dayjs'
import { parseDateSafe, isWorkingDay } from '@/helper/Date'
import { GANTT_VISUAL_FACTOR, DATE_TIME_FORMAT_API, DATE_FORMAT_API } from '@/config/constants'

// Helper to get correct schedule (Custom vs Org override)
export const getComputedSchedule = (collaborator) => {
  if (!collaborator) return null
  
  // Need to parse if string
  let custom = null
  let org = null
  
  if (collaborator.workingSchedule) {
      custom = typeof collaborator.workingSchedule === 'string' 
        ? JSON.parse(collaborator.workingSchedule) 
        : collaborator.workingSchedule
  }

  if (collaborator.organization && collaborator.organization.workingSchedule) {
      org = typeof collaborator.organization.workingSchedule === 'string'
        ? JSON.parse(collaborator.organization.workingSchedule)
        : collaborator.organization.workingSchedule
  }

  if (collaborator.useCustomSchedule && custom) return custom
  if (org) return org
  
  return null // Fallback to default in isWorkingDay
}

export const findRoundRobinCollaborator = (roleId, projectAllocations, existingTasksCount) => {
    const matchingAllocations = projectAllocations.filter(a => 
        a.roles?.some(r => r.id === roleId)
    )
    if (matchingAllocations.length > 0) {
        const index = (existingTasksCount || 0) % matchingAllocations.length
        return matchingAllocations[index].collaborator.id
    }
    return null
}

export const getBlockedDates = (collaborator) => {
    if (!collaborator) return []
    const dates = []
    
    const addRange = (start, end) => {
        let curr = dayjs(start)
        const e = dayjs(end)
        while (curr.isBefore(e) || curr.isSame(e, 'day')) {
             dates.push(curr.format(DATE_FORMAT_API))
             curr = curr.add(1, 'day')
        }
    }

    collaborator.absences?.forEach(a => addRange(a.startDate, a.endDate))
    
    collaborator.workCenter?.publicHolidayCalendars?.forEach(cal => {
        cal.holidays?.forEach(h => {
             const d = parseDateSafe(h.date)
             if(d) dates.push(d.format(DATE_FORMAT_API))
        })
    })

    if (collaborator.holidayCalendar?.holidays) {
         const hols = Array.isArray(collaborator.holidayCalendar.holidays) 
             ? collaborator.holidayCalendar.holidays 
             : []
         hols.forEach(h => {
             const val = typeof h === 'string' ? h : h.date
             if(val) {
                 const d = parseDateSafe(val)
                 if(d) dates.push(d.format(DATE_FORMAT_API))
             }
         })
    }
    return dates
}

export const calculateSequentialStartDate = (roleId, previousTasks, defaultStart, collaboratorId = null, blockedDates = [], weeklySchedule = null) => {
    let estStart = dayjs(defaultStart)
    let lastEndDateForRole = null

    if(previousTasks && previousTasks.length > 0) {
        for (let i = previousTasks.length - 1; i >= 0; i--) {
            const t = previousTasks[i]
            const prevEst = t.estimations?.find(e => e.role.id === roleId)
            
            if (prevEst) {
                if (collaboratorId) {
                    const prevCollabId = prevEst?.collaborator?.id || null
                    if (prevCollabId !== collaboratorId) continue
                }

                let d = null
                if (prevEst.endDate) d = parseDateSafe(prevEst.endDate)
                else if (prevEst.startDate) d = parseDateSafe(prevEst.startDate)

                if (d && d.isValid()) {
                    lastEndDateForRole = d
                    break
                }
            }
        }
    }

    if (lastEndDateForRole) {
        estStart = calculateNextStartDate(lastEndDateForRole, blockedDates, weeklySchedule)
    }
    return estStart
}

// ... existing code ...

export const calculateNextStartDate = (lastEndDate, blockedDates = [], weeklySchedule = null) => {
    let nextStart = dayjs(lastEndDate)
    const blockedSet = new Set(blockedDates)

    const hour = nextStart.hour()
    const isBlocked = blockedSet.has(nextStart.format(DATE_FORMAT_API))
    
    const notWorking = !isWorkingDay(nextStart, weeklySchedule)
    
    if (notWorking || isBlocked || hour >= 18) {
        if (hour >= 18) {
            nextStart = nextStart.add(1, 'day').startOf('day').hour(9)
        }
        
        while (!isWorkingDay(nextStart, weeklySchedule) || blockedSet.has(nextStart.format(DATE_FORMAT_API))) {
            nextStart = nextStart.add(1, 'day')
        }
        nextStart = nextStart.startOf('day').hour(9)
    }
    return nextStart
}

export const getEst = (task, roleId) => task.estimations?.find(e => e.role.id === roleId)

export const getTaskSummary = (task) => {
    if (!task.estimations || task.estimations.length === 0) return { totalHours: 0, dateRange: '-' }
    
    let total = 0
    let minDate = null
    let maxDate = null

    task.estimations.forEach(est => {
        total += est.hours
        if (est.startDate) {
            const d = parseDateSafe(est.startDate)
            if (d && d.isValid()) {
                if (!minDate || d.isBefore(minDate)) minDate = d
            }
        }
        if (est.endDate) {
            const d = parseDateSafe(est.endDate)
            if (d && d.isValid()) {
                if (!maxDate || d.isAfter(maxDate)) maxDate = d
            }
        }
    })

    let dateRange = '-'
    if (minDate) {
        dateRange = minDate.format('DD/MM')
        if (maxDate && !maxDate.isSame(minDate, 'day')) {
            dateRange += ` - ${maxDate.format('DD/MM')}`
        }
    }
    
    return { totalHours: total, dateRange }
}

export const calculateWPEndDate = (tasks) => {
    if (!tasks || tasks.length === 0) return null
    let maxDate = null
    
    tasks.forEach(task => {
        task.estimations?.forEach(est => {
            if (est.endDate) {
                const d = parseDateSafe(est.endDate)
                if (d && d.isValid()) {
                    if (!maxDate || d.isAfter(maxDate)) maxDate = d
                }
            }
        })
    })
    return maxDate
}




