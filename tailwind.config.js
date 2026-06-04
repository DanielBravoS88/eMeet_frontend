/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Tokens shadcn/ui (CSS variables) ────────────────────────────────────
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        primary: {
          DEFAULT:   'var(--primary)',
          foreground:'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:   'var(--secondary)',
          foreground:'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:   'var(--muted)',
          foreground:'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:   'var(--accent)',
          foreground:'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT:   'var(--destructive)',
        },
        card: {
          DEFAULT:   'var(--card)',
          foreground:'var(--card-foreground)',
        },
        popover: {
          DEFAULT:   'var(--popover)',
          foreground:'var(--popover-foreground)',
        },
        sidebar: {
          DEFAULT:              'var(--sidebar)',
          foreground:           'var(--sidebar-foreground)',
          primary:              'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent:               'var(--sidebar-accent)',
          'accent-foreground':  'var(--sidebar-accent-foreground)',
          border:               'var(--sidebar-border)',
          ring:                 'var(--sidebar-ring)',
        },
        // ── Paleta estática eMeet (no duplicar tokens shadcn) ───────────────────
        'primary-light': '#C4B5FD',  // lavanda (también disponible como CSS var)
        'primary-dark':  '#5B21B6',
        silver:  '#D4C8F0',      // plata con tinte morado
        surface: '#07040F',      // fondo base casi negro-púrpura
        // ── Admin panel palette (enterprise dark) ────────
        em: {
          bg: '#0B0E11',
          surface: '#15191C',
          border: '#1E2329',
          muted: '#848E9C',
          text: '#EAECEF',
          'text-dim': '#B7BDC6',
          accent: '#FF6B00',
          'accent-light': '#FF8C3B',
          'accent-dark': '#CC5500',
          positive: '#0ECB81',
          negative: '#F6465D',
          warning: '#F0B90B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        // Gradiente metálico principal — simula luz incidiendo sobre metal
        'metal': 'linear-gradient(160deg, #12082C 0%, #07040F 45%, #0E0520 100%)',
        // Superficies elevadas con brillo metálico
        'metal-card': 'linear-gradient(145deg, #1E1240 0%, #110926 55%, #0C0618 100%)',
        // Borde superior luminoso (luz sobre borde de metal)
        'metal-sheen': 'linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.4) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
