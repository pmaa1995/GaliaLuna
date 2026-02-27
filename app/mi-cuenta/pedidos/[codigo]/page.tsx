import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft, ShoppingBag } from "lucide-react";

import { getOrderDetailByCodeForCustomer } from "../../../../lib/orders/customerRepository";
import { CustomerOrderDetailCard } from "../../../../components/account/orderUi";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

type PageProps = {
  params: {
    codigo: string;
  };
};

function decodeOrderCode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AccountOrderDetailPage({ params }: PageProps) {
  if (!clerkEnabled) {
    redirect("/mi-cuenta");
  }

  const session = await auth();
  if (!session.userId) {
    redirect(
      `/iniciar-sesion?redirect_url=${encodeURIComponent(`/mi-cuenta/pedidos/${params.codigo}`)}`,
    );
  }

  const orderCode = decodeOrderCode(params.codigo).trim();
  if (!orderCode) {
    redirect("/mi-cuenta");
  }

  const order = await getOrderDetailByCodeForCustomer(session.userId, orderCode);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Mi cuenta
            </p>
            <h1 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
              Detalle del pedido
            </h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Revisa el estado de tu pedido, su direccion de entrega y los detalles enviados por WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mi-cuenta/pedidos"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver al historial
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

        <div className="mt-6">
          {order ? (
            <CustomerOrderDetailCard order={order} />
          ) : (
            <div className="rounded-[16px] border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)]/10 p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Pedido no encontrado
              </p>
              <h2 className="mt-2 [font-family:var(--font-playfair)] text-2xl leading-[0.95] text-[color:var(--ink)]">
                No encontramos ese pedido en tu cuenta
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Verifica el codigo o vuelve a tu cuenta para revisar tu historial. Si hiciste el pedido como invitado, el historial no aparece aqui y puedes escribirnos por WhatsApp con el codigo de pedido.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/mi-cuenta/pedidos"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Volver al historial
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
