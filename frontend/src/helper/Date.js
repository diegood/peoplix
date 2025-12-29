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

export const addBusinessDays = (startDate, days, blockedDates = []) => {
    let cursor = dayjs(startDate)
    const blockedSet = new Set(blockedDates)

    const fullDays = Math.floor(days)
    const partialDay = days - fullDays
    
    // Check if start date is blocked or weekend, if so move to next valid day FIRST?
    // User expectation: If task starts on holiday, it should start next valid day?
    // Usually start date is given. But duration adding should skip.
    
    // Add full days skipping weekends and blocked dates
    for (let i = 0; i < fullDays; i++) {
         cursor = cursor.add(1, 'day')
         while (cursor.day() === 0 || cursor.day() === 6 || blockedSet.has(cursor.format(DATE_FORMAT_API))) {
             cursor = cursor.add(1, 'day')
         }
    }
    
    // Add partial day
    if (partialDay > 0) {
        cursor = cursor.add(Math.round(partialDay * 24 * 60), 'minute')
        // Check if we landed on weekend or blocked date
        while (cursor.day() === 0 || cursor.day() === 6 || blockedSet.has(cursor.format(DATE_FORMAT_API))) {
             cursor = cursor.add(1, 'day')
        }
    }
    
    return cursor
}


export const addWorkingDays = (startDate, durationHours, blockedDates = []) => {
    let hoursRemaining = durationHours * GANTT_VISUAL_FACTOR
    let current = dayjs(startDate)
    const blockedSet = new Set(blockedDates)

    while (current.day() === 0 || current.day() === 6 || blockedSet.has(current.format(DATE_FORMAT_API))) {
        current = current.add(1, 'day').startOf('day')
    }
    
    while (hoursRemaining > 0) {
        while (current.day() === 0 || current.day() === 6 || blockedSet.has(current.format(DATE_FORMAT_API))) {
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
