const getLocalDayNumber = date => Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate()
) / 86400000

export const getDaysUntilDeadline = (deadline, now = new Date()) => {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  if (Number.isNaN(deadlineDate.getTime())) return null
  const deadlineDay = Date.UTC(
    deadlineDate.getUTCFullYear(),
    deadlineDate.getUTCMonth(),
    deadlineDate.getUTCDate()
  ) / 86400000
  return deadlineDay - getLocalDayNumber(now)
}

export const isDeadlinePassed = (deadline, now = new Date()) => {
  const daysUntilDeadline = getDaysUntilDeadline(deadline, now)
  return daysUntilDeadline !== null && daysUntilDeadline < 0
}
