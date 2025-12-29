import dayjs from '@/config/dayjs'
import { GANTT_VISUAL_FACTOR, DATE_FORMAT_API } from '@/config/constants'

export const parseDateSafe = (val) => {
    if (!val) return null
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return dayjs(parseInt(val)).tz('Europe/Madrid')
    }
    return dayjs(val).tz('Europe/Madrid')
}

export const formatDate = (dateVal) => {
    const d = parseDateSafe(dateVal)
    return d && d.isValid() ? d.format(DATE_FORMAT_API) : ''
}

const getDayKey = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.day()]
}

export const isWorkingDay = (date, weeklySchedule = null) => {
    if (!weeklySchedule) {
        return date.day() !== 0 && date.day() !== 6
    }
    const key = getDayKey(date)
    return weeklySchedule[key]?.active !== false
}

export const addBusinessDays = (startDate, days, blockedDates = [], weeklySchedule = null) => {
    let cursor = dayjs(startDate)
    const blockedSet = new Set(blockedDates)

    const fullDays = Math.floor(days)
    const partialDay = days - fullDays
    
    // Add full days
    for (let i = 0; i < fullDays; i++) {
         cursor = cursor.add(1, 'day')
         while (!isWorkingDay(cursor, weeklySchedule) || blockedSet.has(cursor.format(DATE_FORMAT_API))) {
             cursor = cursor.add(1, 'day')
         }
    }
    
    // Add partial day
    if (partialDay > 0) {
        cursor = cursor.add(Math.round(partialDay * 24 * 60), 'minute')
        while (!isWorkingDay(cursor, weeklySchedule) || blockedSet.has(cursor.format(DATE_FORMAT_API))) {
             cursor = cursor.add(1, 'day')
        }
    }
    
    return cursor
}

export const getDailySchedule = (date, weeklySchedule) => {
    if (!weeklySchedule) {
        const isWork = date.day() !== 0 && date.day() !== 6
        return { active: isWork, start: '09:00', end: '17:00' }
    }
    const key = getDayKey(date)
    return weeklySchedule[key] || { active: false }
}

export const getDailyWorkingHours = (date, weeklySchedule) => {
    const sched = getDailySchedule(date, weeklySchedule)
    if (!sched.active) return 0
    
    const [startH, startM] = sched.start.split(':').map(Number)
    const [endH, endM] = sched.end.split(':').map(Number)
    
    const start = dayjs(date).hour(startH).minute(startM || 0)
    const end = dayjs(date).hour(endH).minute(endM || 0)
    
    return Math.max(0, end.diff(start, 'hour', true))
}

export const addWorkingDays = (startDate, durationHours, blockedDates = [], weeklySchedule = null) => {
    let hoursRemaining = durationHours
    let current = dayjs(startDate)
    const blockedSet = new Set(blockedDates)
    let loops = 0

    while (hoursRemaining > 0 && loops < 1000) {
        loops++
        
        while (!isWorkingDay(current, weeklySchedule) || blockedSet.has(current.format(DATE_FORMAT_API))) {
            current = current.add(1, 'day').startOf('day')
            const sched = getDailySchedule(current, weeklySchedule)
            if (sched.active) {
                const [h, m] = sched.start.split(':').map(Number)
                current = current.hour(h).minute(m || 0)
            }
        }

        const sched = getDailySchedule(current, weeklySchedule)
        const [startH, startM] = sched.start.split(':').map(Number)
        const [endH, endM] = sched.end.split(':').map(Number)
        
        const dayStartTime = dayjs(current).hour(startH).minute(startM || 0)
        const dayEndTime = dayjs(current).hour(endH).minute(endM || 0)
        
        if (current.isBefore(dayStartTime)) {
            current = dayStartTime
        }

        if (current.isAfter(dayEndTime) || current.isSame(dayEndTime)) {
             current = current.add(1, 'day').startOf('day')
             continue
        }
        
        let availableToday = dayEndTime.diff(current, 'hour', true)
        availableToday = Math.max(0, availableToday)
        
        if (availableToday <= 0.01) { // Floating point protection
             current = current.add(1, 'day').startOf('day')
             const nextSched = getDailySchedule(current, weeklySchedule)
             if (nextSched.active) {
                 const [h, m] = nextSched.start.split(':').map(Number)
                 current = current.hour(h).minute(m || 0)
             }
             continue
        }

        if (hoursRemaining <= availableToday) {
            current = current.add(hoursRemaining * 60, 'minute')
            hoursRemaining = 0
        } else {
            hoursRemaining -= availableToday
            current = current.add(1, 'day').startOf('day')
            const nextSched = getDailySchedule(current, weeklySchedule)
            if (nextSched.active) {
                 const [h, m] = nextSched.start.split(':').map(Number)
                 current = current.hour(h).minute(m || 0)
            }
        }
    }
    return current
}
