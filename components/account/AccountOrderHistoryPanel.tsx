import Link from "next/link";
import { ExternalLink, MessageCircle, ShoppingBag } from "lucide-react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import {
  getLatestInProgressOrderForCustomer,
  listOrderSummariesForCustomerPage,
} from "../../lib/orders/customerRepository";
import { type CustomerOrderSummary } from "../../lib/orders/types";
import { formatDOP } from "../../types/product";
import {
  AccountOrderStatusBadge,
  buildCustomerOrderDetailHref,
  buildCustomerOrderSupportUrl,
  formatAccountOrderDateTime,
  InProgressOrderCard,
} from "./orderUi";

const COMPACT_PAGE_SIZE = 5;
const FULL_PAGE_SIZE = 10;

function buildAccountOrdersPageHref(page: number) {
  return page > 1 ? `/mi-cuenta/pedidos?page=${page}` : "/mi-cuenta/pedidos";
}

function buildSupportHomeUrl() {
  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}`;
}

type HistoryMode = "compact" | "full";

function OrderListCard({ order }: { order: CustomerOrderSummary }) {
  return (
    <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--ink)]">
            {order.orderCode}
          </p>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            {formatAccountOrderDateTime(order.createdAt)} - {order.itemCount}{" "}
            {order.itemCount === 1 ? "pieza" : "piezas"} -{" "}
            {formatDOP(order.subtotalAmount)}
          </p>
        </div>
        <AccountOrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={buildCustomerOrderDetailHref(order.orderCode)}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          Ver detalle
        </Link>
        <a
          href={buildCustomerOrderSupportUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          WhatsApp
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function OrdersEmptyState() {
  return (
    <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
        Sin pedidos en tu cuenta
      </p>
      <h3 className="mt-2 [font-family:var(--font-playfair)] text-xl leading-[0.95] text-[color:var(--ink)]">
        Tu historial aparecera aqui
      </h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
        Solo se muestran los pedidos realizados mientras iniciaste sesion. Si
        pediste como invitado, puedes escribir por WhatsApp y compartir el
        codigo de pedido para seguimiento.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Explorar catalogo
        </Link>
        <a
          href={buildSupportHomeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Soporte por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default async function AccountOrderHistoryPanel({
  clerkUserId,
  page = 1,
  mode = "compact",
}: {
  clerkUserId: string;
  page?: number;
  mode?: HistoryMode;
}) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const isCompact = mode === "compact";
  const pageSize = isCompact ? COMPACT_PAGE_SIZE : FULL_PAGE_SIZE;
  const currentPage = isCompact ? 1 : safePage;

  const [historyPage, inProgressOrder] = await Promise.all([
    listOrderSummariesForCustomerPage({
      clerkUserId,
      page: currentPage,
      pageSize,
      includeTotal: !isCompact,
    }),
    getLatestInProgressOrderForCustomer(clerkUserId),
  ]);

  const { orders, total, hasNextPage, hasPreviousPage } = historyPage;
  const visibleOrders = inProgressOrder
    ? orders.filter((order) => order.id !== inProgressOrder.id)
    : orders;

  return (
    <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Pedidos de tu cuenta
          </p>
          <p className="text-sm font-medium text-[color:var(--ink)]">
            Historial, estado y soporte por pedido
          </p>
        </div>
      </div>

      {orders.length === 0 && !inProgressOrder ? (
        <div className="mt-5">
          <OrdersEmptyState />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {inProgressOrder ? <InProgressOrderCard order={inProgressOrder} /> : null}

          <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  {isCompact
                    ? `${visibleOrders.length + (inProgressOrder ? 1 : 0)} pedidos recientes`
                    : `${total} ${total === 1 ? "pedido encontrado" : "pedidos encontrados"}`}
                </p>
                <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                  {isCompact
                    ? `Mostrando los ultimos ${Math.min(pageSize, total)} pedidos de tu cuenta.`
                    : "Se muestran los pedidos hechos con tu cuenta."}
                </p>
              </div>

              {isCompact ? (
                <Link
                  href={buildAccountOrdersPageHref(1)}
                  className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  Ver historial completo
                </Link>
              ) : (
                <p className="text-xs text-[color:var(--ink-soft)]">
                  Pagina {historyPage.page} -{" "}
                  {Math.min(total, historyPage.page * historyPage.pageSize)} de {total}
                </p>
              )}
            </div>

            {visibleOrders.length > 0 ? (
              <div className="mt-4 space-y-3">
                {visibleOrders.map((order) => (
                  <OrderListCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 text-sm text-[color:var(--ink-soft)]">
                {inProgressOrder
                  ? "Tu pedido en progreso aparece arriba. El resto del historial se mostrara aqui."
                  : "No hay pedidos en esta pagina."}
              </div>
            )}

            {!isCompact && (hasPreviousPage || hasNextPage) ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--line)] pt-4">
                <div className="text-xs text-[color:var(--ink-soft)]">
                  Cargando {FULL_PAGE_SIZE} pedidos por pagina para mantener la
                  cuenta rapida.
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasPreviousPage ? (
                    <Link
                      href={buildAccountOrdersPageHref(historyPage.page - 1)}
                      className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-[color:var(--line)]/60 bg-[color:var(--bg-soft)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                      Anterior
                    </span>
                  )}

                  {hasNextPage ? (
                    <Link
                      href={buildAccountOrdersPageHref(historyPage.page + 1)}
                      className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-[color:var(--line)]/60 bg-[color:var(--bg-soft)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                      Siguiente
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
