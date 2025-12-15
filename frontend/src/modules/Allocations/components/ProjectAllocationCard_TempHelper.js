
const isAbsentInWeek = (collaboratorId) => {
    if (!props.absences || !collaboratorId) return null
    const [year, week] = props.currentWeek.split('-W').map(Number)
    
    // Simple check: does any absence overlap with this ISO week?
    // We can use a library or manual check.
    // Start of ISO week
    const d = new Date(year, 0, 1 + (week - 1) * 7)
    const dayOfWeek = d.getDay()
    const isoStart = d
    if (dayOfWeek <= 4) isoStart.setDate(d.getDate() - d.getDay() + 1)
    else isoStart.setDate(d.getDate() + 8 - d.getDay())
    
    const weekStart = isoStart // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday

    const absence = props.absences.find(a => {
        if (a.collaboratorId !== collaboratorId) return false
        const start = new Date(a.startDate)
        const end = new Date(a.endDate)
        // Overlap check
        return start <= weekEnd && end >= weekStart
    })
    
    return absence
}
