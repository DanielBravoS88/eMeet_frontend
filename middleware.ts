import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient, hasSupabaseEnv } from './src/lib/supabase'

// Rutas que requieren sesión activa (cualquier rol)
const AUTH_ROUTES = ['/profile', '/chat', '/saved', '/search', '/creator', '/locatario']

// Rutas que requieren rol admin
const ADMIN_ROUTES = ['/admin']

// Rutas que requieren la capacidad de crear eventos (flag isEventCreator).
// Mantenemos /locatario como alias por compatibilidad con bookmarks viejos.
const CREATOR_ROUTES = ['/creator', '/locatario']

function extractRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): string | undefined {
  return (
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined)
  )
}

function isEventCreator(user: { user_metadata?: Record<string, unknown> }): boolean {
  return Boolean(user.user_metadata?.is_event_creator)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Sin Supabase configurado no podemos validar sesión server-side
  if (!hasSupabaseEnv) return response

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isCreatorRoute = CREATOR_ROUTES.some((r) => pathname.startsWith(r))
  const needsCheck = isAuthRoute || isAdminRoute || isCreatorRoute || pathname === '/auth'

  // Optimización: rutas públicas no pasan por getUser()
  if (!needsCheck) return response

  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      response = NextResponse.next({ request: { headers: request.headers } })
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → redirigir a /auth si la ruta lo requiere
  if (!user) {
    if (isAuthRoute || isAdminRoute || isCreatorRoute) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  const userRole = extractRole(user)

  // Rutas admin → solo admin
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Rutas de creador → admin o cualquier user con isEventCreator activo
  if (isCreatorRoute && userRole !== 'admin' && !isEventCreator(user)) {
    return NextResponse.redirect(new URL('/profile?activate-creator=1', request.url))
  }

  // Usuario autenticado que visita /auth → mandarlo al home
  if (pathname === '/auth') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
