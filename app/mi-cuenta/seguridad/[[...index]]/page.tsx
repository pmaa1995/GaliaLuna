import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default function AccountSecurityPage() {
  if (!clerkEnabled) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[980px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Seguridad</p>
          <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
            Seguridad y acceso
          </h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Esta seccion estara disponible cuando Clerk este configurado completamente en este entorno.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/mi-cuenta" className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
              Volver a mi cuenta
            </Link>
            <Link href="/iniciar-sesion" className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
              Iniciar sesion
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-55">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[color:var(--brand-coral)] blur-3xl" />
            <div className="absolute -left-8 top-24 h-24 w-24 rounded-full bg-[color:var(--brand-sage)] blur-3xl" />
            <div className="absolute right-8 top-8 h-20 w-40 rounded-full border border-[color:var(--line)]" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Mi cuenta</p>
                <p className="text-sm font-medium text-[color:var(--ink)]">Seguridad y acceso</p>
              </div>
            </div>

            <h1 className="mt-4 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
              Gestiona tu acceso
            </h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Desde aqui puedes actualizar metodos de acceso, correo y seguridad de tu cuenta. Si usas acceso por codigo al correo, no necesitas recordar una contrasena para entrar.
            </p>

            <div className="mt-5 grid gap-3 text-sm text-[color:var(--ink)]">
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Acceso por correo con codigo (sin complicaciones).</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Si activas contrasena en Clerk, podras cambiarla desde este panel.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Tus datos de entrega se siguen gestionando en Mi cuenta.</div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/mi-cuenta" className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                Volver a mi cuenta
              </Link>
              <Link href="/" className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                Seguir comprando
              </Link>
            </div>
          </div>
        </section>

        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-3 sm:p-5">
          <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-2 sm:p-3">
            <UserProfile path="/mi-cuenta/seguridad" routing="path" />
          </div>
        </section>
      </div>
    </main>
  );
}
