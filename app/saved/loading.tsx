import Layout from '../../src/components/Layout'

export default function SavedLoading() {
  return (
    <Layout headerTitle="Guardados">
      <div className="px-4 py-5">

        {/* Section label */}
        <div className="shimmer mb-4 h-4 w-28 rounded-full" />

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="shimmer aspect-[4/3] w-full rounded-2xl" />
              <div className="shimmer h-3.5 w-3/4 rounded-full" />
              <div className="shimmer h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>

      </div>
    </Layout>
  )
}
