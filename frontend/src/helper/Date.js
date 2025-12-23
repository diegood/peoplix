import dayjs from '@/config/dayjs'

export const parseDateSafe = (val) => {
    if (!val) return null
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return dayjs.utc(parseInt(val))
    }
    return dayjs(val)
}

export const formatDate = (dateVal) => {
    const d = parseDateSafe(dateVal)
    return d && d.isValid() ? d.format('YYYY-MM-DD') : ''
}

export const addBusinessDays = (startDate, days) => {
    let cursor = dayjs(startDate)
    let daysRemaining = Math.ceil(days) 
    
    let current = cursor
    for (let i = 0; i < daysRemaining; i++) {
         current = current.add(1, 'day')
         while (current.day() === 0 || current.day() === 6) {
             current = current.add(1, 'day')
         }
    }
    
    return current
}


export const addWorkingDays = (startDate, durationHours, blockedDates = []) => {
    // Scaling factor: 1 work hour = 3 visual hours (8h = 24h)
    let hoursRemaining = durationHours * 3
    let current = dayjs(startDate)
    const blockedSet = new Set(blockedDates)

    // Ensure start date is valid (skip weekends/blocked)
    while (current.day() === 0 || current.day() === 6 || blockedSet.has(current.format('YYYY-MM-DD'))) {
        current = current.add(1, 'day').startOf('day')
    }
    
    while (hoursRemaining > 0) {
        // Ensure current day is valid (in case we wrapped into one)
        while (current.day() === 0 || current.day() === 6 || blockedSet.has(current.format('YYYY-MM-DD'))) {
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
