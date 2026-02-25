import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Registro seguro
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.2rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Crea tu cuenta
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Guarda tus datos para futuras compras, agiliza la atención y revisa
            tus pedidos desde una sola cuenta.
          </p>

          <div className="mt-6 space-y-3">
            {[
              "Correo verificado y acceso protegido.",
              "Tu carrito y compra por WhatsApp siguen siendo simples.",
              "Puedes cerrar sesión cuando quieras.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--ink)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
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
              Ver catálogo
            </Link>
          </div>
        </section>

        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-6">
          {clerkEnabled ? (
            <div className="flex justify-center">
              <SignUp
                path="/registrarse"
                routing="path"
                signInUrl="/iniciar-sesion"
                fallbackRedirectUrl="/mi-cuenta"
              />
            </div>
          ) : (
            <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Acceso de cuenta
              </p>
              <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                Registro disponible pronto
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Mientras activamos esta sección, puedes explorar el catálogo y
                cerrar tu compra por WhatsApp con la misma atención personalizada.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Ir al catálogo
                </Link>
                <Link
                  href="/iniciar-sesion"
                  className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
