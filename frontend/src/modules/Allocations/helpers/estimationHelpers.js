import dayjs from '@/config/dayjs'
import { parseDateSafe, isWorkingDay, getDailySchedule } from '@/helper/Date'
import { GANTT_VISUAL_FACTOR, DATE_TIME_FORMAT_API, DATE_FORMAT_API } from '@/config/constants'

export const getComputedSchedule = (collaborator) => {
  if (!collaborator) return null
  
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
  
  return null
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

        let bestDate = null
        
        previousTasks.forEach(t => {
            const est = t.estimations?.find(e => e.role.id === roleId)
            if (est) {
                if (collaboratorId) {
                    const cId = est.collaborator?.id
                    if (cId !== collaboratorId) return
                }

                let d = null
                if (est.endDate) d = parseDateSafe(est.endDate)
                else if (est.startDate) d = parseDateSafe(est.startDate)
                
                if (d && d.isValid()) {
                    if (!bestDate || d.isAfter(bestDate)) {
                        bestDate = d
                    }
                }
            }
        })

        if (bestDate) {
            lastEndDateForRole = bestDate
        }
    }

    if (lastEndDateForRole) {
        estStart = calculateNextStartDate(lastEndDateForRole, blockedDates, weeklySchedule)
    }
    return estStart
}

export const calculateNextStartDate = (lastEndDate, blockedDates = [], weeklySchedule = null) => {
    let nextStart = dayjs(lastEndDate)
    const blockedSet = new Set(blockedDates)

    const daySched = isWorkingDay(nextStart, weeklySchedule) 
        ? getDailySchedule(nextStart, weeklySchedule) 
        : { active: false }
    
    const isBlocked = blockedSet.has(nextStart.format(DATE_FORMAT_API))
    
    let endHour = 18
    if (daySched.active && daySched.end) {
        const [h] = daySched.end.split(':').map(Number)
        endHour = h
    }

    const hour = nextStart.hour()
    
    const isNearEndOfDay = hour >= (endHour - 1)

    if (!daySched.active || isBlocked || isNearEndOfDay) {
        if (daySched.active && isNearEndOfDay) {
            nextStart = nextStart.add(1, 'day')
        }
        
        while (!isWorkingDay(nextStart, weeklySchedule) || blockedSet.has(nextStart.format(DATE_FORMAT_API))) {
            nextStart = nextStart.add(1, 'day')
        }
        
        nextStart = nextStart.startOf('day')
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




