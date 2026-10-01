import StoreShell from "../../../components/store/StoreShell";

export default function ProductLoading() {
  return <StoreShell><div className="shop-container py-7 pb-20"><p role="status" className="sr-only">Cargando la pieza…</p><div aria-hidden="true"><div className="skeleton-shimmer mb-7 h-4 w-40" /><div className="grid gap-8 md:grid-cols-2 lg:gap-20"><div className="skeleton-shimmer aspect-[4/5]" /><div className="space-y-5 pt-2"><div className="skeleton-shimmer h-3 w-24" /><div className="skeleton-shimmer h-12 w-4/5" /><div className="skeleton-shimmer h-12 w-3/5" /><div className="skeleton-shimmer h-6 w-28" /><div className="skeleton-shimmer h-12 w-full" /><div className="skeleton-shimmer h-12 w-full" /><div className="skeleton-shimmer h-4 w-5/6" /><div className="skeleton-shimmer h-4 w-full" /></div></div></div></div></StoreShell>;
}
