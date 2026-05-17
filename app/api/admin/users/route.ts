import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/src/lib/supabase'

async function verifyAdmin(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createSupabaseAdminClient()
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  return { userId: user.id }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (auth instanceof NextResponse) return auth

  const db = createSupabaseAdminClient()

  const [profilesResult, authUsersResult] = await Promise.all([
    db.from('profiles').select('id, name, role, created_at').order('created_at', { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
  }

  const emailMap = new Map(authUsersResult.data.users.map((u) => [u.id, u.email ?? '']))

  const users = profilesResult.data.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    email: emailMap.get(p.id) ?? '',
    created_at: p.created_at,
  }))

  return NextResponse.json(users)
}
