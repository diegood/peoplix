import { ref } from 'vue'
import { dayjs } from '@/config'

export function useWeekNavigation(initialWeek = null) {
    const getISOWeek = (d = new Date()) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
        return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
    }

    const selectedWeek = ref(initialWeek || getISOWeek())
    const monthlyRange = ref({
        start: dayjs().format('YYYY-MM'),
        end: dayjs().add(2, 'month').format('YYYY-MM')
    })

    const parseWeekToDate = (weekStr) => {
        if (!weekStr) return null
        const [year, week] = weekStr.split('-W').map(Number)
        if (!year || !week) return null
        const anchor = dayjs(`${year}-01-04`).startOf('isoWeek') // ISO week 1 anchor
        return anchor.add(week - 1, 'week')
    }

    const getPrevWeek = (weekStr) => {
        const [y, w] = weekStr.split('-W').map(Number)
        if (!y || !w) return null
        if (w > 1) return `${y}-W${(w - 1).toString().padStart(2, '0')}`
        return `${y - 1}-W52`
    }

    const isAllocationActiveInWeek = (allocation, weekStr) => {
        const target = parseWeekToDate(weekStr)
        const start = parseWeekToDate(allocation?.startWeek)
        const endDate = allocation?.endWeek ? parseWeekToDate(allocation.endWeek)?.endOf('isoWeek') : null
        
        if (target && start) {
            const targetMs = target.valueOf()
            const startMs = start.valueOf()
            if (!endDate) return startMs <= targetMs
            return startMs <= targetMs && endDate.valueOf() >= targetMs
        }
        
        if (allocation?.startWeek && weekStr) {
            const openEnded = !allocation.endWeek && allocation.startWeek <= weekStr
            const bounded = allocation.endWeek && allocation.startWeek <= weekStr && allocation.endWeek >= weekStr
            return openEnded || bounded
        }
        return false
    }

    const gotToWeek = (direction) => {
        const operation = direction === 'prev' ? 'subtract' : 'add'
        const [y, w] = selectedWeek.value.split('-W').map(Number)
        const d = dayjs(`${y}-01-04`).startOf('isoWeek').add(w - 1, 'week')[operation](1, 'week')
        selectedWeek.value = `${d.isoWeekYear()}-W${d.isoWeek().toString().padStart(2, '0')}`
    }

    return {
        selectedWeek,
        monthlyRange,
        getISOWeek,
        parseWeekToDate,
        getPrevWeek,
        isAllocationActiveInWeek,
        gotToWeek
    }
}
