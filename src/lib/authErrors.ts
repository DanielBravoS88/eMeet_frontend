/**
 * Traduce los errores crudos de Supabase / red a mensajes amigables y
 * accionables para el formulario de auth.
 *
 * Devuelve además:
 *   • field — qué input resaltar (email o password), si aplica.
 *   • suggestion — qué accion ofrecer al usuario debajo del mensaje:
 *       'forgot'  → link a recuperar contraseña
 *       'signup'  → invitar a crear cuenta
 *       'verify'  → reenviar correo de verificación / ir al inbox
 *       'retry'   → simplemente reintentar
 */
export type AuthErrorField = 'email' | 'password' | null
export type AuthErrorSuggestion = 'forgot' | 'signup' | 'verify' | 'retry' | null

export interface HumanAuthError {
  message: string
  hint?: string
  field: AuthErrorField
  suggestion: AuthErrorSuggestion
}

const FALLBACK: HumanAuthError = {
  message: 'No pudimos iniciar sesión. Intenta nuevamente en unos segundos.',
  field: null,
  suggestion: 'retry',
}

export function humanizeAuthError(error: unknown): HumanAuthError {
  const raw = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase()

  if (!raw) return FALLBACK

  // ── Credenciales incorrectas (el caso más frecuente) ───────────────────────
  if (
    raw.includes('invalid login credentials') ||
    raw.includes('invalid email or password') ||
    raw.includes('credenciales')
  ) {
    return {
      message: 'Correo o contraseña incorrectos.',
      hint: 'Verifica que estén bien escritos. Recuerda que la contraseña distingue mayúsculas de minúsculas.',
      field: 'password',
      suggestion: 'forgot',
    }
  }

  // ── Email no confirmado ────────────────────────────────────────────────────
  if (raw.includes('email not confirmed') || raw.includes('not confirmed') || raw.includes('verificad')) {
    return {
      message: 'Aún no confirmas tu correo.',
      hint: 'Revisa tu bandeja de entrada (y la carpeta de spam) y haz click en el enlace de verificación que te enviamos.',
      field: 'email',
      suggestion: 'verify',
    }
  }

  // ── Usuario inexistente ────────────────────────────────────────────────────
  if (raw.includes('user not found') || raw.includes('no encontramos') || raw.includes('no user')) {
    return {
      message: 'No encontramos una cuenta con ese correo.',
      hint: '¿Es la primera vez que entras a eMeet? Puedes crear tu cuenta en segundos.',
      field: 'email',
      suggestion: 'signup',
    }
  }

  // ── Rate limit / demasiados intentos ───────────────────────────────────────
  if (raw.includes('rate limit') || raw.includes('too many') || raw.includes('429')) {
    return {
      message: 'Demasiados intentos seguidos.',
      hint: 'Espera 1 o 2 minutos antes de volver a intentarlo para evitar bloqueos temporales.',
      field: null,
      suggestion: null,
    }
  }

  // ── Cuenta deshabilitada o restringida ─────────────────────────────────────
  if (raw.includes('banned') || raw.includes('disabled') || raw.includes('suspend')) {
    return {
      message: 'Tu cuenta está deshabilitada.',
      hint: 'Si crees que es un error, contáctanos para revisarlo.',
      field: null,
      suggestion: null,
    }
  }

  // ── Email mal formado (validación local de Supabase) ───────────────────────
  if (raw.includes('invalid email') || raw.includes('email is invalid')) {
    return {
      message: 'El correo no tiene un formato válido.',
      hint: 'Asegúrate de incluir el "@" y el dominio (ej. nombre@dominio.com).',
      field: 'email',
      suggestion: null,
    }
  }

  // ── Contraseña muy corta ───────────────────────────────────────────────────
  if (raw.includes('password') && (raw.includes('short') || raw.includes('6 characters') || raw.includes('weak'))) {
    return {
      message: 'La contraseña no cumple con los requisitos.',
      hint: 'Debe tener al menos 6 caracteres.',
      field: 'password',
      suggestion: null,
    }
  }

  // ── Red caída / backend no responde ────────────────────────────────────────
  if (
    raw.includes('failed to fetch') ||
    raw.includes('network') ||
    raw.includes('networkerror') ||
    raw.includes('fetch failed') ||
    raw.includes('etimedout') ||
    raw.includes('econnrefused')
  ) {
    return {
      message: 'No hay conexión con el servidor.',
      hint: 'Revisa tu internet o vuelve a intentar en unos segundos. Si el problema persiste, el servicio podría estar momentáneamente caído.',
      field: null,
      suggestion: 'retry',
    }
  }

  // ── Fallback: usamos el mensaje original pero le damos forma ──────────────
  if (error instanceof Error && error.message) {
    return {
      message: error.message,
      field: null,
      suggestion: 'retry',
    }
  }

  return FALLBACK
}
