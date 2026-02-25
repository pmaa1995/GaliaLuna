export default function Loading() {
  return (
    <main className="relative min-h-screen px-4 pb-24 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 h-14 border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
          <div className="skeleton-shimmer h-5 w-48" />
        </div>

        <section className="grid gap-6 border-b border-[color:var(--line)] pb-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="skeleton-shimmer h-4 w-40" />
            <div className="skeleton-shimmer h-14 w-[90%]" />
            <div className="skeleton-shimmer h-14 w-[75%]" />
            <div className="skeleton-shimmer h-4 w-full" />
            <div className="skeleton-shimmer h-4 w-[88%]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton-shimmer h-11 border border-[color:var(--line)]" />
              <div className="skeleton-shimmer h-11 border border-[color:var(--line)]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="skeleton-shimmer h-20 border border-[color:var(--line)]" />
              <div className="skeleton-shimmer h-20 border border-[color:var(--line)]" />
              <div className="skeleton-shimmer h-20 border border-[color:var(--line)]" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="skeleton-shimmer aspect-[4/5] border border-[color:var(--line)]" />
            <div className="skeleton-shimmer h-24 border border-[color:var(--line)]" />
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="grid gap-4 border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:grid-cols-[12rem_minmax(0,1fr)]"
            >
              <div className="skeleton-shimmer aspect-[4/5] border border-[color:var(--line)]" />
              <div className="space-y-3">
                <div className="skeleton-shimmer h-3 w-20" />
                <div className="skeleton-shimmer h-8 w-[60%]" />
                <div className="skeleton-shimmer h-4 w-full" />
                <div className="skeleton-shimmer h-4 w-[85%]" />
                <div className="flex gap-2">
                  <div className="skeleton-shimmer h-10 w-28 border border-[color:var(--line)]" />
                  <div className="skeleton-shimmer h-10 w-36 border border-[color:var(--line)]" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
