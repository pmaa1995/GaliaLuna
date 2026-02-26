import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6">
        <section className="relative overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[color:var(--brand-coral)] blur-3xl" />
            <div className="absolute -left-8 top-24 h-24 w-24 rounded-full bg-[color:var(--brand-sage)] blur-3xl" />
            <div className="absolute right-6 top-6 grid grid-cols-2 gap-2 opacity-25">
              <span className="h-4 w-4 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]" />
              <span className="mt-2 h-4 w-4 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]" />
              <span className="h-4 w-4 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]" />
              <span className="mt-2 h-4 w-4 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]" />
            </div>
          </div>

          <div className="relative">
            <div className="mb-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 lg:hidden">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Cuenta Galia Luna</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                Entra con tu correo y guarda tus datos de entrega para futuras compras.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/iniciar-sesion"
                  aria-current="page"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/registrarse"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>

            <div className="mb-4 hidden border-b border-[color:var(--line)] pb-4 sm:mb-5 sm:pb-5 lg:block">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Inicio de sesion</p>
              <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.8rem,4vw,2.6rem)] leading-[0.94] tracking-[-0.03em] text-[color:var(--ink)]">
                Accede con tu correo
              </h1>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Tu cuenta es opcional. Sirve para guardar datos de entrega y agilizar futuras compras.
              </p>
            </div>

            {clerkEnabled ? (
              <div className="mx-auto max-w-[560px] rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3 sm:p-5">
                <div className="mb-3 flex items-center justify-between rounded-[12px] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)] sm:hidden">
                  <span>Acceso por correo</span>
                  <span className="text-[color:var(--ink)]">Seguro</span>
                </div>
                <SignIn
                  path="/iniciar-sesion"
                  routing="path"
                  signUpUrl="/registrarse"
                  fallbackRedirectUrl="/mi-cuenta"
                  appearance={clerkFormAppearance}
                />
              </div>
            ) : (
              <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Acceso de cuenta</p>
                <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                  Esta seccion estara disponible pronto
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                  Mientras terminamos de activar el acceso de cuenta, puedes seguir comprando desde el catalogo y confirmar tu pedido por WhatsApp.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Ayuda de acceso</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                Si no recuerdas tu contrasena o acceso, escribe tu correo y continua. Recibiras un codigo para entrar sin complicaciones.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/registrarse"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Volver al catalogo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:block lg:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute right-8 top-10 h-40 w-40 rounded-full border border-[color:var(--line)]" />
            <div className="absolute right-16 top-20 h-24 w-24 rounded-full border border-[color:var(--line)]" />
            <div className="absolute bottom-10 left-8 h-20 w-44 rounded-full border border-[color:var(--line)]" />
          </div>
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Acceso seguro</p>
            <h2 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.6rem,3.6vw,3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
              Tu cuenta Galia Luna
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Guarda tus datos y agiliza la atencion cuando necesites ayuda con una pieza o con la entrega.
            </p>

            <div className="mt-5 grid gap-2.5 text-sm text-[color:var(--ink)] sm:gap-3">
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Correo verificado y sesion segura.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Tu compra sigue siendo atendida por una persona.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Direcciones guardadas para futuras entregas (opcional).</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Si no recuerdas tu acceso, puedes entrar de nuevo con codigo al correo.</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
