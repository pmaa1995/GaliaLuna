"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-5 px-6 py-16">
      <p className="text-sm uppercase tracking-widest">Galia Luna</p>
      <h1 className="[font-family:var(--font-playfair)] text-4xl">No pudimos cargar esta página</h1>
      <p className="leading-7">Ocurrió un problema temporal. Tu pedido permanece en este navegador; puedes volver a intentarlo.</p>
      <button type="button" onClick={reset} className="rounded-full bg-[color:var(--brand-sage)] px-6 py-3 font-medium text-[#111111]">Volver a intentar</button>
      <Link href="/" className="underline underline-offset-4">Volver al inicio</Link>
    </main>
  );
}
