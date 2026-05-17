import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'eMeet — Descubre eventos y lugares cercanos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #12082C 0%, #07040F 45%, #0E0520 100%)',
          position: 'relative',
        }}
      >
        {/* Glow de fondo */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: '-3px',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#ffffff' }}>e</span>
          <span style={{ color: '#C4B5FD' }}>Meet</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            fontWeight: 500,
            color: '#9CA3AF',
            letterSpacing: '0.5px',
          }}
        >
          Descubre eventos y lugares cercanos
        </div>

        {/* Pills decorativas */}
        <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
          {['🎉 Fiestas', '🎵 Música', '🍽️ Gastronomía', '🤝 Networking'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(124,58,237,0.2)',
                border: '1px solid rgba(196,181,253,0.25)',
                borderRadius: 100,
                padding: '10px 22px',
                fontSize: 20,
                color: '#C4B5FD',
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: 'rgba(156,163,175,0.6)',
            letterSpacing: '1px',
          }}
        >
          emeet.app
        </div>
      </div>
    ),
    { ...size },
  )
}
