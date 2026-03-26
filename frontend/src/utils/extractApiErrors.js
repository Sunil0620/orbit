const fallbackMessage = 'Unable to complete the request. Please try again.'

function flattenMessages(value) {
  if (Array.isArray(value)) {
    return value.map(flattenMessages).filter(Boolean).join(' ')
  }

  if (value && typeof value === 'object') {
    return Object.values(value).map(flattenMessages).filter(Boolean).join(' ')
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

export default function extractApiErrors(error) {
  const payload = error?.response?.data

  if (!payload) {
    return { form: fallbackMessage }
  }

  if (typeof payload === 'string') {
    if (payload.includes('<!DOCTYPE html') || payload.includes('<html')) {
      return {
        form: 'The backend returned an HTML error page instead of JSON. Check the API base URL and backend logs.',
      }
    }

    return { form: payload }
  }

  if (Array.isArray(payload)) {
    return { form: flattenMessages(payload) || fallbackMessage }
  }

  if (typeof payload === 'object') {
    return Object.entries(payload).reduce((accumulator, [key, value]) => {
      const normalizedKey =
        key === 'detail' || key === 'non_field_errors' ? 'form' : key

      return {
        ...accumulator,
        [normalizedKey]: flattenMessages(value) || fallbackMessage,
      }
    }, {})
  }

  return { form: fallbackMessage }
}
