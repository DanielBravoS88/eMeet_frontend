import Layout from '../../src/components/Layout'

export default function ChatLoading() {
  return (
    <Layout headerTitle="Chat">
      <div className="flex flex-col gap-1 px-2 py-3">

        {/* Search chats */}
        <div className="shimmer mb-3 h-10 w-full rounded-2xl" />

        {/* Conversation rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="shimmer h-12 w-12 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="shimmer h-3.5 w-32 rounded-full" />
                <div className="shimmer h-3 w-10 rounded-full" />
              </div>
              <div className="shimmer h-3 w-48 rounded-full" />
            </div>
          </div>
        ))}

      </div>
    </Layout>
  )
}
