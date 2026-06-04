'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMagnifyingGlass, HiMusicalNote, HiXMark, HiPlay } from 'react-icons/hi2'
import { HiStop } from 'react-icons/hi'

interface DeezerTrack {
  id: number
  title: string
  preview: string
  artist: { name: string }
  album: { title: string; cover_medium: string }
}

interface Props {
  value: string | null
  trackLabel: string | null
  onChange: (previewUrl: string | null, label: string | null, trackId: string | null) => void
}

export function DeezerSearch({ value, trackLabel, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DeezerTrack[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/deezer?q=${encodeURIComponent(q)}`)
      const json = (await res.json()) as { data?: DeezerTrack[] }
      setResults(json.data ?? [])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(val), 500)
  }

  function togglePlay(track: DeezerTrack) {
    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    audioRef.current?.pause()
    const audio = new Audio(track.preview)
    audio.onended = () => setPlayingId(null)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlayingId(track.id)
  }

  function selectTrack(track: DeezerTrack) {
    audioRef.current?.pause()
    setPlayingId(null)
    onChange(track.preview, `${track.artist.name} — ${track.title}`, String(track.id))
    setQuery('')
    setResults([])
  }

  function clearSelection() {
    audioRef.current?.pause()
    setPlayingId(null)
    onChange(null, null, null)
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
        Música del evento{' '}
        <span className="text-[10px] normal-case font-normal text-muted/70">
          preview 30s · opcional
        </span>
      </span>

      {value && trackLabel ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
          <HiMusicalNote className="h-4 w-4 shrink-0 text-primary-light" />
          <p className="flex-1 truncate text-sm text-white">{trackLabel}</p>
          <button
            type="button"
            onClick={() => {
              const audio = new Audio(value)
              audio.play().catch(() => {})
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/40 text-primary-light transition-colors"
            title="Escuchar preview"
          >
            <HiPlay className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-muted hover:text-red-400 transition-colors"
            title="Quitar canción"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-card bg-surface px-3 py-2.5 focus-within:border-primary/50 transition-colors">
            <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar canción en Deezer..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-muted outline-none"
            />
            {isSearching && (
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-white/10 bg-card shadow-xl"
              >
                {results.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={track.album.cover_medium}
                      alt={track.album.title}
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{track.title}</p>
                      <p className="truncate text-xs text-muted">{track.artist.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePlay(track)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-primary/30 text-white transition-colors"
                      title={playingId === track.id ? 'Detener' : 'Escuchar preview'}
                    >
                      {playingId === track.id ? (
                        <HiStop className="h-3.5 w-3.5" />
                      ) : (
                        <HiPlay className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTrack(track)}
                      className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary-light hover:bg-primary/30 transition-colors whitespace-nowrap"
                    >
                      Usar
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
