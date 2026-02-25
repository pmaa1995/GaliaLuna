export default function ProductGridSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="rounded-[20px] border border-[color:var(--border-warm)] bg-[color:var(--paper)]/65 p-4 shadow-soft">
          <div className="skeleton-shimmer h-12 rounded-[16px]" />
        </div>

        <div className="rounded-[24px] border border-[color:var(--border-warm)] bg-[color:var(--paper)]/65 p-6 shadow-soft sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="skeleton-shimmer h-3 w-36 rounded-full" />
              <div className="skeleton-shimmer h-10 w-[85%] rounded-full" />
              <div className="skeleton-shimmer h-10 w-[62%] rounded-full" />
              <div className="skeleton-shimmer h-4 w-[70%] rounded-full" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="skeleton-shimmer h-20 rounded-[18px]" />
                <div className="skeleton-shimmer h-20 rounded-[18px]" />
              </div>
            </div>
            <div className="grid gap-3">
              <div className="skeleton-shimmer aspect-[4/5] rounded-[22px]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton-shimmer h-16 rounded-[18px]" />
                <div className="skeleton-shimmer h-16 rounded-[18px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-[20px] border border-[color:var(--border-warm)] bg-[color:var(--paper)]/65 shadow-soft"
            >
              <div className="skeleton-shimmer aspect-[4/5]" />
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="skeleton-shimmer h-2.5 w-14 rounded-full" />
                  <div className="skeleton-shimmer h-4 w-16 rounded-full" />
                </div>
                <div className="skeleton-shimmer h-5 w-[80%] rounded-full" />
                <div className="skeleton-shimmer h-4 w-full rounded-full" />
                <div className="skeleton-shimmer h-4 w-[65%] rounded-full" />
                <div className="skeleton-shimmer h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
