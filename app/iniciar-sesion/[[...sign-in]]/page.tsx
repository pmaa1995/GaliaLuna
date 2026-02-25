import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Acceso seguro
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.2rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Tu cuenta Galia Luna
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Accede con tu correo para guardar tus datos y agilizar la atencion cuando necesites ayuda por WhatsApp.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-[color:var(--ink)]">
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Correo verificado y sesion segura.
            </div>
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Tu compra sigue siendo atendida por una persona.
            </div>
            <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              Puedes seguir comprando sin cuenta desde el catalogo publico.
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Volver al catalogo
            </Link>
            <Link
              href="/registrarse"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Crear cuenta
            </Link>
          </div>
        </section>

        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6">
          <div className="mb-4 border-b border-[color:var(--line)] pb-4 sm:mb-5 sm:pb-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Inicio de sesion
            </p>
            <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
              Accede con tu correo
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
              Usa el correo de tu cuenta para continuar.
            </p>
          </div>

          {clerkEnabled ? (
            <div className="flex justify-center">
              <SignIn
                path="/iniciar-sesion"
                routing="path"
                signUpUrl="/registrarse"
                fallbackRedirectUrl="/mi-cuenta"
                appearance={clerkFormAppearance}
              />
            </div>
          ) : (
            <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Acceso de cuenta
              </p>
              <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                Esta seccion estara disponible pronto
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Mientras terminamos de activar el acceso de cuenta, puedes seguir comprando con normalidad desde el catalogo y confirmar tu pedido por WhatsApp.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Ir al catalogo
                </Link>
                <Link
                  href="/registrarse"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
