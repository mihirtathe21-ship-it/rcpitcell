import { Job } from '../models/Job.js'

export const getUtcDayStart = (date = new Date()) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate()
))

export const getCurrentIndiaDayStart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)))
}

export const hasDeadlinePassed = (deadline, now = new Date()) => {
  if (!deadline) return false
  const deadlineDate = new Date(deadline)
  if (Number.isNaN(deadlineDate.getTime())) return false
  return getUtcDayStart(deadlineDate) < getCurrentIndiaDayStart(now)
}

export const closeExpiredActiveJobs = async () => {
  await Job.updateMany(
    {
      status: 'active',
      lastDateToApply: { $lt: getCurrentIndiaDayStart() },
    },
    { $set: { status: 'closed' } }
  )
}
