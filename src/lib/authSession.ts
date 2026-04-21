import { getSupabaseBrowserClient, hasSupabaseEnv } from './supabase'

export async function getSupabaseAuthSession() {
  if (!hasSupabaseEnv) return null

  const { data, error } = await getSupabaseBrowserClient().auth.getSession()
  if (error) {
    throw new Error('No se pudo validar la sesion activa.')
  }

  return data.session ?? null
}

export async function getSupabaseAccessToken() {
  const session = await getSupabaseAuthSession()
  return session?.access_token ?? null
}

export async function requireSupabaseAccessToken(
  message = 'Tu sesion expiro o no esta activa. Inicia sesion nuevamente.',
) {
  const token = await getSupabaseAccessToken()
  if (!token) {
    throw new Error(message)
  }

  return token
}
