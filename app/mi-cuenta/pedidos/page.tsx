import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft, ShoppingBag } from "lucide-react";

import AccountOrderHistoryPanel from "../../../components/account/AccountOrderHistoryPanel";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

type PageSearchParams = {
  page?: string | string[];
};

function getHistoryPage(searchParams?: PageSearchParams) {
  const raw = searchParams?.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  if (!clerkEnabled) {
    redirect("/mi-cuenta");
  }

  const session = await auth();
  if (!session.userId) {
    redirect(
      `/iniciar-sesion?redirect_url=${encodeURIComponent("/mi-cuenta/pedidos")}`,
    );
  }

  const page = getHistoryPage(searchParams);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Mi cuenta
            </p>
            <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
              Historial de pedidos
            </h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Revisa tus pedidos en una vista completa, con estado y acceso directo
              a soporte por WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mi-cuenta"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver a mi cuenta
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Seguir comprando
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <AccountOrderHistoryPanel
          clerkUserId={session.userId}
          page={page}
          mode="full"
        />
      </div>
    </main>
  );
}
