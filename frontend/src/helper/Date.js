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

export const addWorkingDays = (startDate, durationHours, blockedDates = [], weeklySchedule = null) => {
    let hoursRemaining = durationHours * GANTT_VISUAL_FACTOR
    let current = dayjs(startDate)
    const blockedSet = new Set(blockedDates)

    while (!isWorkingDay(current, weeklySchedule) || blockedSet.has(current.format(DATE_FORMAT_API))) {
        current = current.add(1, 'day').startOf('day')
    }
    
    while (hoursRemaining > 0) {
        while (!isWorkingDay(current, weeklySchedule) || blockedSet.has(current.format(DATE_FORMAT_API))) {
             current = current.add(1, 'day').startOf('day')
        }

        const endOfDay = current.endOf('day')
        const hoursInDay = endOfDay.diff(current, 'hour', true)

        if (hoursRemaining <= hoursInDay) {
            current = current.add(hoursRemaining, 'hour')
            hoursRemaining = 0
        } else {
            hoursRemaining -= hoursInDay
            current = current.add(1, 'day').startOf('day')
        }
    }
    return current
}
