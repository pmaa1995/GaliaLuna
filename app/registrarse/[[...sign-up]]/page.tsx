import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:p-8">
          <div className="mb-4 border-b border-[color:var(--line)] pb-4 sm:mb-5 sm:pb-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Crear cuenta
            </p>
            <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.8rem,4vw,2.6rem)] leading-[0.94] tracking-[-0.03em] text-[color:var(--ink)]">
              Registrate con tu correo
            </h1>
            <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
              Tu cuenta es opcional y se usa para guardar datos de entrega y agilizar futuras compras.
            </p>
          </div>

          {clerkEnabled ? (
            <div className="mx-auto max-w-[560px] rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 sm:p-5">
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
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Acceso de cuenta
              </p>
              <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                Registro disponible pronto
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Mientras activamos esta seccion, puedes explorar el catalogo y cerrar tu compra por WhatsApp con la misma atencion personalizada.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-2 text-sm text-[color:var(--ink)] lg:hidden">
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Correo verificado y acceso protegido.
            </div>
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Puedes guardar direccion y telefono para futuras entregas.
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Ya tengo cuenta
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Ver catalogo
            </Link>
          </div>
        </section>

        <section className="hidden border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6 lg:block lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Registro seguro
          </p>
          <h2 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.6rem,3.6vw,3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
            Crea tu cuenta Galia Luna
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Guarda tus datos una sola vez para que la asesora confirme mas rapido disponibilidad y entrega en tus proximas compras.
          </p>

          <div className="mt-5 grid gap-2.5 text-sm text-[color:var(--ink)] sm:gap-3">
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Correo verificado y acceso protegido.
            </div>
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Tu compra por WhatsApp sigue siendo simple.
            </div>
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Puedes editar direccion, telefono y referencias de entrega.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
