const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim().replace(/\/$/, '')

export function requireBackendUrl(feature?: string) {
  if (!BACKEND_URL) {
    const suffix = feature ? ` para ${feature}` : ''
    throw new Error(`Falta NEXT_PUBLIC_BACKEND_URL${suffix}.`)
  }

  return BACKEND_URL
}
