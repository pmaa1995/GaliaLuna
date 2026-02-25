import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, auth } from "@clerk/nextjs/server";
import { CheckCircle2, MessageCircle, ShieldCheck, ShoppingBag, User } from "lucide-react";

import AccountSignOutButton from "../../components/auth/AccountSignOutButton";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default async function AccountPage() {
  if (!clerkEnabled) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[960px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Mi cuenta
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Activa el acceso seguro
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Esta pagina queda lista para funcionar cuando agregues las llaves de
            Clerk en tu entorno local y en Cloudflare.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 text-xs leading-6 text-[color:var(--ink)]">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/iniciar-sesion
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/registrarse`}
          </pre>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Ir a iniciar sesion
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const session = await auth();

  if (!session.userId) {
    redirect("/iniciar-sesion");
  }

  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Cliente";

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Mi cuenta
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.2rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Hola, {displayName}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Tu cuenta te permite guardar tus datos y agilizar futuras compras
            por WhatsApp con atencion personalizada.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Nombre
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
                {displayName}
              </p>
            </div>
            <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Correo
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--ink)] break-all">
                {primaryEmail || "No disponible"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Seguir comprando
            </Link>
            <a
              href="https://wa.me/18290000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Hablar con vendedora
            </a>
            <AccountSignOutButton />
          </div>
        </section>

        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Seguridad
              </p>
              <p className="text-sm font-medium text-[color:var(--ink)]">
                Acceso protegido por Clerk
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Correo verificado y sesion segura.",
              "La web no necesita guardar tarjetas para cerrar compras por WhatsApp.",
              "Tu cuenta se usa para mejorar seguimiento y atencion.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-sage)]" />
                <p className="text-sm leading-6 text-[color:var(--ink)]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Proximamente
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink)]">
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-[color:var(--brand-sage)]" />
                Historial de pedidos
              </li>
              <li className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[color:var(--brand-sage)]" />
                Direcciones guardadas
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[color:var(--brand-sage)]" />
                Soporte y seguimiento
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
