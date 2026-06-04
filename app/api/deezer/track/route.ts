import { NextRequest, NextResponse } from 'next/server'

/**
 * Re-resuelve un preview fresco de Deezer a partir del ID estable de la canción.
 *
 * Las URLs de preview de Deezer (cdnt-preview.dzcdn.net/...?hdnea=exp=...) caducan
 * a los pocos días/semanas. El ID del track, en cambio, es permanente. Guardamos el
 * ID en la base de datos y pedimos aquí un preview nuevo justo antes de reproducir.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id?.trim() || !/^\d+$/.test(id)) {
    return NextResponse.json({ preview: null }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.deezer.com/track/${id}?output=json`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ preview: null }, { status: 502 })
    }

    const data = (await res.json()) as { preview?: string; error?: unknown }
    if (data.error || !data.preview) {
      return NextResponse.json({ preview: null }, { status: 404 })
    }

    return NextResponse.json({ preview: data.preview })
  } catch {
    return NextResponse.json({ preview: null }, { status: 500 })
  }
}
