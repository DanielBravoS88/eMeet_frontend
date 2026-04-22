import Layout from '../../src/components/Layout'

export default function ProfileLoading() {
  return (
    <Layout showHeader={false}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">

        {/* Avatar + nombre */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="shimmer h-24 w-24 rounded-full" />
          <div className="shimmer h-5 w-36 rounded-full" />
          <div className="shimmer h-3.5 w-24 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-16 rounded-2xl" />
          ))}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="shimmer h-3.5 w-full rounded-full" />
          <div className="shimmer h-3.5 w-4/5 rounded-full" />
          <div className="shimmer h-3.5 w-2/3 rounded-full" />
        </div>

        {/* Interests chips */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-7 w-20 rounded-full" style={{ width: `${60 + i * 12}px` }} />
          ))}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-36 rounded-2xl" />
          ))}
        </div>

      </div>
    </Layout>
  )
}
