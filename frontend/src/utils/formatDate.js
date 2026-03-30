const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function toDate(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function isSameDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}

export function formatMessageTime(value) {
  const date = toDate(value)

  if (!date) {
    return ''
  }

  return timeFormatter.format(date)
}

export function formatMessageDayLabel(value) {
  const date = toDate(value)

  if (!date) {
    return ''
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(date, now)) {
    return 'Today'
  }

  if (isSameDay(date, yesterday)) {
    return 'Yesterday'
  }

  return date.getFullYear() === now.getFullYear()
    ? shortDateFormatter.format(date)
    : fullDateFormatter.format(date)
}

export default function formatDate(value) {
  const dayLabel = formatMessageDayLabel(value)
  const timeLabel = formatMessageTime(value)

  if (!dayLabel && !timeLabel) {
    return ''
  }

  if (!dayLabel) {
    return timeLabel
  }

  if (!timeLabel) {
    return dayLabel
  }

  return `${dayLabel} at ${timeLabel}`
}
