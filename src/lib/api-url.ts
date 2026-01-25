const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const sanitizedApiUrl = rawApiUrl.replace(/\/$/, '')

export const apiBaseUrl = sanitizedApiUrl.endsWith('/api')
  ? sanitizedApiUrl
  : `${sanitizedApiUrl}/api`

export const socketBaseUrl = apiBaseUrl.replace(/\/api$/, '')
