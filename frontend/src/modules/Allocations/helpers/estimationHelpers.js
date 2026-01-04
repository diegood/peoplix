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

export const calculateSequentialStartDate = (roleId, previousTasks, defaultStart, collaboratorId = null, blockedDates = [], weeklySchedule = null, recurrentEvents = []) => {
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




export const addWorkingDays = (startDate, hoursToAdd, blockedDates = [], weeklySchedule = null, recurrentEvents = []) => {
    let currentDate = dayjs(startDate)
    let remainingHours = hoursToAdd
    let safetyCounter = 0
    const MAX_LOOPS = 500 

    while (remainingHours > 0 && safetyCounter < MAX_LOOPS) {
        safetyCounter++
        
        let dailyCapacity = 8 
        
        const isBlocked = blockedDates.includes(currentDate.format(DATE_FORMAT_API))
        const schedule = isWorkingDay(currentDate, weeklySchedule) ? getDailySchedule(currentDate, weeklySchedule) : { active: false }
        
        if (!schedule.active || isBlocked) {
            currentDate = currentDate.add(1, 'day').startOf('day')
            continue
        }

        if (schedule.start && schedule.end) {
            const [startH] = schedule.start.split(':').map(Number)
            const [endH] = schedule.end.split(':').map(Number)
            
            let dayStartHour = startH
            if (currentDate.hour() > startH) {
                dayStartHour = currentDate.hour()
                if (currentDate.minute() > 0) dayStartHour += 1
            }
            
            dailyCapacity = Math.max(0, endH - dayStartHour)
            
            const totalSpan = endH - startH
            if (totalSpan > 8) {
                if (dayStartHour < 14) {
                    dailyCapacity -= 1
                }
            }
        }
        
        if (recurrentEvents && recurrentEvents.length > 0) {
            recurrentEvents.forEach(event => {
                let applies = false
                
                let evtStart = event.startDate || event.date
                if (typeof evtStart === 'string' && /^\d+$/.test(evtStart)) {
                    evtStart = parseInt(evtStart)
                }
                const evtDate = dayjs(evtStart)
                

                if (currentDate.isBefore(evtDate, 'day')) return
                
                if (event.endDate) {
                    let evtEnd = event.endDate
                    if (typeof evtEnd === 'string' && /^\d+$/.test(evtEnd)) {
                        evtEnd = parseInt(evtEnd)
                    }
                    if (currentDate.isAfter(dayjs(evtEnd), 'day')) return
                }

                switch (event.type) {
                    case 'DAILY':
                        applies = true
                        break
                    case 'WEEKLY':
                        if (currentDate.day() === event.dayOfWeek) applies = true
                        break
                    case 'MONTHLY':
                        if (currentDate.date() === event.dayOfMonth) applies = true
                        break
                    case 'SPECIFIC':
                         if (currentDate.isSame(dayjs(event.date), 'day')) applies = true
                         break
                }

                if (applies) { dailyCapacity -= event.hours }
            })
        }

        const effectiveCapacity = Math.max(0, dailyCapacity)
        
        if (effectiveCapacity > 0) {
            if (remainingHours <= effectiveCapacity) {
                const [startH, startM] = schedule.start.split(':').map(Number)
                let finalTime = currentDate.hour(startH).minute(startM || 0).second(0)
                
                finalTime = finalTime.add(remainingHours, 'hour')
                
                 if (recurrentEvents && recurrentEvents.length > 0) {
                     recurrentEvents.forEach(event => {
                        let applies = false
                        let evtStart = event.startDate || event.date
                        if (typeof evtStart === 'string' && /^\d+$/.test(evtStart)) evtStart = parseInt(evtStart)
                        const evtDate = dayjs(evtStart)

                        if (currentDate.isBefore(evtDate, 'day')) return
                        if (event.endDate) {
                            let evtEnd = event.endDate
                            if (typeof evtEnd === 'string' && /^\d+$/.test(evtEnd)) evtEnd = parseInt(evtEnd)
                            if (currentDate.isAfter(dayjs(evtEnd), 'day')) return
                        }

                        switch (event.type) {
                            case 'DAILY': applies = true; break;
                            case 'WEEKLY': if (currentDate.day() === event.dayOfWeek) applies = true; break;
                            case 'MONTHLY': if (currentDate.date() === event.dayOfMonth) applies = true; break;
                            case 'SPECIFIC': if (currentDate.isSame(dayjs(event.date), 'day')) applies = true; break;
                        }
                        
                        if (applies) {
                            finalTime = finalTime.add(event.hours, 'hour')
                        }
                     })
                 }
                
                return finalTime
            } else {
                remainingHours -= effectiveCapacity
                currentDate = currentDate.add(1, 'day').startOf('day')
            }
        } else {
            currentDate = currentDate.add(1, 'day').startOf('day')
        }
    }
    
    return currentDate.hour(18).minute(0).second(0)
}

export const calculateEstimation = ({
    roleId,
    hours,
    taskIndex,
    allTasks,
    wpStartDateFormatted,
    projectAllocations,
    recurrentEvents,
    forceStartDate,
    existingEstimation
}) => {
    let estStart
    let collaboratorId = null
    
    if (existingEstimation && existingEstimation.collaborator) {
        collaboratorId = existingEstimation.collaborator.id
    } else {
        collaboratorId = findRoundRobinCollaborator(roleId, projectAllocations, taskIndex)
    }

    const allocation = projectAllocations.find(a => a.collaborator.id === collaboratorId)
    const blockedDates = getBlockedDates(allocation?.collaborator)
    const schedule = getComputedSchedule(allocation?.collaborator)

    if (forceStartDate && dayjs(forceStartDate).isValid()) {
        estStart = dayjs(forceStartDate)
    } else if (existingEstimation && existingEstimation.startDate && parseDateSafe(existingEstimation.startDate)?.isValid()) {
         estStart = parseDateSafe(existingEstimation.startDate)
    } else {
        const previousTasks = taskIndex > 0 ? allTasks.slice(0, taskIndex) : []
        estStart = calculateSequentialStartDate(
            roleId, 
            previousTasks, 
            wpStartDateFormatted, 
            collaboratorId, 
            blockedDates, 
            schedule, 
            recurrentEvents
        )
    }

    const estEnd = addWorkingDays(estStart, hours, blockedDates, schedule, recurrentEvents)

    return {
        startDate: estStart,
        endDate: estEnd,
        collaboratorId,
        hours
    }
}
