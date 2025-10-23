import { useEffect, useState } from 'react'
import './App.css'

type TimeBreakdown = {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

const BREAK_GROUND_DATE = new Date('2011-11-09T00:00:00-05:00')
const PROJECTED_OPEN_DATE = new Date('2020-12-31T00:00:00-05:00')
const PLANNED_DURATION_MS =
  PROJECTED_OPEN_DATE.getTime() - BREAK_GROUND_DATE.getTime()

const twoDigitFormatter = new Intl.NumberFormat('en-US', {
  minimumIntegerDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const addMonthsClamped = (date: Date, monthsToAdd: number) => {
  const next = new Date(date.getTime())
  const originalDay = next.getDate()

  next.setDate(1)
  next.setMonth(next.getMonth() + monthsToAdd)

  const lastDayOfTargetMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0
  ).getDate()

  next.setDate(Math.min(originalDay, lastDayOfTargetMonth))
  return next
}

const calculateBreakdown = (
  startDate: Date,
  now: Date
): TimeBreakdown => {
  if (now <= startDate) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
  }

  const start = new Date(startDate.getTime())
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())

  let anchor = addMonthsClamped(start, totalMonths)

  let adjustedTotalMonths = totalMonths
  if (anchor > now) {
    adjustedTotalMonths -= 1
    anchor = addMonthsClamped(start, adjustedTotalMonths)
  }

  const years = Math.floor(adjustedTotalMonths / 12)
  const months = adjustedTotalMonths % 12

  let remainingMs = now.getTime() - anchor.getTime()

  const dayMs = 24 * 60 * 60 * 1000
  const hourMs = 60 * 60 * 1000
  const minuteMs = 60 * 1000

  const days = Math.floor(remainingMs / dayMs)
  anchor.setDate(anchor.getDate() + days)
  remainingMs = now.getTime() - anchor.getTime()

  const hours = Math.floor(remainingMs / hourMs)
  anchor.setHours(anchor.getHours() + hours)
  remainingMs = now.getTime() - anchor.getTime()

  const minutes = Math.floor(remainingMs / minuteMs)
  anchor.setMinutes(anchor.getMinutes() + minutes)
  remainingMs = now.getTime() - anchor.getTime()

  const seconds = Math.floor(remainingMs / 1000)

  return { years, months, days, hours, minutes, seconds }
}

const calculateOverrunPercent = (now: Date) => {
  if (PLANNED_DURATION_MS <= 0) {
    return 0
  }

  const totalElapsed = now.getTime() - BREAK_GROUND_DATE.getTime()
  const overrunMs = totalElapsed - PLANNED_DURATION_MS

  if (overrunMs <= 0) {
    return 0
  }

  return (overrunMs / PLANNED_DURATION_MS) * 100
}

const TimerCard = ({
  title,
  caption,
  breakdown,
}: {
  title: string
  caption: string
  breakdown: TimeBreakdown
}) => (
  <section className="timer-card" aria-label={title}>
    <h2>{title}</h2>
    <div className="time-parts">
      <div className="part">
        <span className="value">
          {breakdown.years.toLocaleString('en-US')}
        </span>
        <span className="label">years</span>
      </div>
      <div className="part">
        <span className="value">
          {breakdown.months.toLocaleString('en-US')}
        </span>
        <span className="label">months</span>
      </div>
      <div className="part">
        <span className="value">
          {breakdown.days.toLocaleString('en-US')}
        </span>
        <span className="label">days</span>
      </div>
      <div className="part condensed">
        <span className="value">
          {twoDigitFormatter.format(breakdown.hours)}
        </span>
        <span className="label">hours</span>
      </div>
      <div className="part condensed">
        <span className="value">
          {twoDigitFormatter.format(breakdown.minutes)}
        </span>
        <span className="label">minutes</span>
      </div>
      <div className="part condensed">
        <span className="value">
          {twoDigitFormatter.format(breakdown.seconds)}
        </span>
        <span className="label">seconds</span>
      </div>
    </div>
    <p className="caption">{caption}</p>
  </section>
)

const App = () => {
  const [timerState, setTimerState] = useState(() => {
    const now = new Date()
    return {
      breakGround: calculateBreakdown(BREAK_GROUND_DATE, now),
      projectedOpen: calculateBreakdown(PROJECTED_OPEN_DATE, now),
      overrunPercent: calculateOverrunPercent(now),
    }
  })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date()
      setTimerState({
        breakGround: calculateBreakdown(BREAK_GROUND_DATE, now),
        projectedOpen: calculateBreakdown(PROJECTED_OPEN_DATE, now),
        overrunPercent: calculateOverrunPercent(now),
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Toronto Transit Reality Check</p>
        <h1>Eglinton Crosstown Delay Tracker</h1>
        <p className="subtitle">
          Measuring how long the city has been waiting for the Crosstown LRT to arrive.
        </p>
      </header>

      <div className="timer-grid">
        <TimerCard
          title="Time since November 9, 2011"
          caption="since the Eglinton LRT broke ground"
          breakdown={timerState.breakGround}
        />
        <TimerCard
          title="Time since December 31, 2020"
          caption="since the Eglinton LRT was projected to open"
          breakdown={timerState.projectedOpen}
        />
      </div>

      <div className="overrun">
        The Eglinton LRT is taking{' '}
        <span className="highlight">
          {percentFormatter.format(timerState.overrunPercent)}
          %
        </span>{' '}
        longer than projected.
      </div>
    </div>
  )
}

export default App
