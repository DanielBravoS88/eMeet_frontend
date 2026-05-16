import { NextResponse } from 'next/server'

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim().replace(/\/$/, '')

export async function GET() {
  if (!BACKEND_URL) {
    return NextResponse.json({ ok: false, error: 'NEXT_PUBLIC_BACKEND_URL not set' })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json()) as unknown
    return NextResponse.json({ ok: res.ok, backend: data })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'ping failed',
    })
  }
}
