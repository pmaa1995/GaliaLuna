import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6">
        <section className="relative overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[color:var(--brand-coral)] blur-3xl" />
            <div className="absolute -left-8 top-24 h-24 w-24 rounded-full bg-[color:var(--brand-sage)] blur-3xl" />
            <div className="absolute left-6 top-6 grid grid-cols-2 gap-2 opacity-25">
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
                Crea tu cuenta con correo para guardar direccion, telefono y referencias de entrega.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/iniciar-sesion"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/registrarse"
                  aria-current="page"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>

            <div className="mb-4 hidden border-b border-[color:var(--line)] pb-4 sm:mb-5 sm:pb-5 lg:block">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Crear cuenta</p>
              <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.8rem,4vw,2.6rem)] leading-[0.94] tracking-[-0.03em] text-[color:var(--ink)]">
                Registrate con tu correo
              </h1>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Tu cuenta es opcional y se usa para guardar datos de entrega y agilizar futuras compras.
              </p>
            </div>

            {clerkEnabled ? (
              <div className="mx-auto max-w-[560px] rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3 sm:p-5">
                <div className="mb-3 flex items-center justify-between rounded-[12px] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)] sm:hidden">
                  <span>Registro por correo</span>
                  <span className="text-[color:var(--ink)]">Seguro</span>
                </div>
                <SignUp
                  path="/registrarse"
                  routing="path"
                  signInUrl="/iniciar-sesion"
                  fallbackRedirectUrl="/mi-cuenta"
                  appearance={clerkFormAppearance}
                />
              </div>
            ) : (
              <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Acceso de cuenta</p>
                <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                  Registro disponible pronto
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                  Mientras activamos esta seccion, puedes explorar el catalogo y cerrar tu compra por WhatsApp con la misma atencion personalizada.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Facilidades para tu cuenta</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                Despues de crear tu cuenta podras guardar telefono, direccion y referencias de entrega para comprar mas rapido por WhatsApp.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/iniciar-sesion"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Ya tengo cuenta
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Ver catalogo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:block lg:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute left-8 top-10 h-40 w-40 rounded-full border border-[color:var(--line)]" />
            <div className="absolute left-16 top-20 h-24 w-24 rounded-full border border-[color:var(--line)]" />
            <div className="absolute bottom-10 right-8 h-20 w-44 rounded-full border border-[color:var(--line)]" />
          </div>
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Registro seguro</p>
            <h2 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.6rem,3.6vw,3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
              Crea tu cuenta Galia Luna
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Guarda tus datos una sola vez para que la asesora confirme mas rapido disponibilidad y entrega en tus proximas compras.
            </p>

            <div className="mt-5 grid gap-2.5 text-sm text-[color:var(--ink)] sm:gap-3">
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Correo verificado y acceso protegido.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Tu compra por WhatsApp sigue siendo simple.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Puedes editar direccion, telefono y referencias de entrega.</div>
              <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">Tambien podras gestionar seguridad y acceso desde tu cuenta.</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
