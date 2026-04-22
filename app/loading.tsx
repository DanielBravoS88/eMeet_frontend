export default function Loading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#12082C_0%,_#07040F_45%,_#0E0520_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-stretch px-0 sm:px-3 lg:px-5 lg:py-4">

        {/* Sidebar skeleton (desktop) */}
        <div className="hidden h-full w-56 shrink-0 flex-col gap-3 p-4 lg:flex">
          <div className="shimmer mb-8 h-8 w-24 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-10 w-full rounded-xl" />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden
          bg-[linear-gradient(145deg,_#1E1240_0%,_#110926_55%,_#0C0618_100%)]
          sm:rounded-l-[28px] sm:border sm:border-violet-500/15">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-500/15 px-4 py-3 lg:px-5 lg:py-4">
            <div className="shimmer h-7 w-20 rounded-lg" />
            <div className="shimmer h-5 w-32 rounded-full" />
            <div className="shimmer h-8 w-8 rounded-full" />
          </div>

          {/* Card stack skeleton */}
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="relative w-full max-w-sm">
              {/* Cards apiladas */}
              <div className="shimmer absolute -bottom-3 left-3 right-3 h-[420px] rounded-3xl opacity-30" />
              <div className="shimmer absolute -bottom-1.5 left-1.5 right-1.5 h-[420px] rounded-3xl opacity-60" />
              <div className="shimmer h-[420px] w-full rounded-3xl" />
            </div>
          </div>

          {/* Bottom nav skeleton (mobile) */}
          <div className="flex items-center justify-around border-t border-violet-500/15 px-2 py-3 lg:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
