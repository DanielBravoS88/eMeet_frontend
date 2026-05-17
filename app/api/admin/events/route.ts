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
  const { data, error } = await db
    .from('locatario_events')
    .select('id, title, category, address, created_at, organizer_name, status')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
