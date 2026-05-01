import Layout from '../../src/components/Layout'

export default function SearchLoading() {
  return (
    <Layout showHeader={false} showDesktopMap>
      <div className="flex flex-col gap-4 px-4 py-5">

        {/* Search bar */}
        <div className="shimmer h-11 w-full rounded-2xl" />

        {/* Filter chips */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-8 shrink-0 rounded-full" style={{ width: `${64 + i * 10}px` }} />
          ))}
        </div>

        {/* Results list */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="shimmer h-20 w-20 shrink-0 rounded-2xl" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="shimmer h-4 w-3/4 rounded-full" />
                <div className="shimmer h-3 w-1/2 rounded-full" />
                <div className="shimmer h-3 w-1/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  )
}
