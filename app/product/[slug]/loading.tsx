export default function ProductLoading() {
  return (
    <main className="relative min-h-screen px-4 pb-24 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 h-14 border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
          <div className="skeleton-shimmer h-5 w-52" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="skeleton-shimmer aspect-[4/5] border border-[color:var(--line)]" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              <div className="skeleton-shimmer aspect-square border border-[color:var(--line)]" />
              <div className="skeleton-shimmer aspect-square border border-[color:var(--line)]" />
              <div className="skeleton-shimmer aspect-square border border-[color:var(--line)]" />
              <div className="skeleton-shimmer aspect-square border border-[color:var(--line)]" />
            </div>
          </div>

          <div className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-5">
            <div className="skeleton-shimmer h-3 w-20" />
            <div className="mt-3 space-y-3">
              <div className="skeleton-shimmer h-10 w-[80%]" />
              <div className="skeleton-shimmer h-10 w-[65%]" />
            </div>
            <div className="mt-4 flex items-center justify-between border-b border-[color:var(--line)] pb-4">
              <div className="skeleton-shimmer h-6 w-24" />
              <div className="skeleton-shimmer h-4 w-20" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="skeleton-shimmer h-4 w-full" />
              <div className="skeleton-shimmer h-4 w-[92%]" />
              <div className="skeleton-shimmer h-4 w-[70%]" />
            </div>
            <div className="mt-5 grid gap-2">
              <div className="skeleton-shimmer h-11 border border-[color:var(--line)]" />
              <div className="skeleton-shimmer h-11 border border-[color:var(--line)]" />
              <div className="skeleton-shimmer h-11 border border-[color:var(--line)]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
