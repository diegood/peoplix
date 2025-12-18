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
