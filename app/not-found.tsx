import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-5 px-6 py-16">
      <p className="text-sm uppercase tracking-widest">Galia Luna · 404</p>
      <h1 className="[font-family:var(--font-playfair)] text-4xl">Esta página no está disponible</h1>
      <p className="leading-7">La pieza puede haber cambiado o el enlace puede estar incompleto. Explora el catálogo para encontrar las piezas disponibles.</p>
      <Link href="/#catalogo" className="rounded-full bg-[color:var(--brand-sage)] px-6 py-3 font-medium text-[#111111]">Explorar el catálogo</Link>
    </main>
  );
}
