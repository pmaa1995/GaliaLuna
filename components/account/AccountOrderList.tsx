import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { type CustomerOrderSummary } from "../../lib/orders/types";
import { AccountOrderRow } from "./orderUi";

function ordersPageHref(page: number) {
  return page > 1 ? `/mi-cuenta/pedidos?page=${page}` : "/mi-cuenta/pedidos";
}

export interface AccountOrderListProps {
  mode: "compact" | "full";
  orders: CustomerOrderSummary[];
  inProgressOrder: CustomerOrderSummary | null;
  total: number;
  page: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export default function AccountOrderList({ mode, orders, inProgressOrder, total, page, pageSize, hasPreviousPage, hasNextPage }: AccountOrderListProps) {
  const compact = mode === "compact";
  const rest = inProgressOrder ? orders.filter((order) => order.id !== inProgressOrder.id) : orders;
  const empty = orders.length === 0 && !inProgressOrder;
  return (
    <section aria-labelledby="orders-title">
      <div className="acct-section-head">
        <h2 id="orders-title">{compact ? "Tus pedidos" : `${total} ${total === 1 ? "pedido" : "pedidos"}`}</h2>
        {compact && !empty ? <Link href={ordersPageHref(1)}>Ver todos</Link> : null}
      </div>

      {empty ? (
        <div className="acct-empty">
          <p>Aquí verás los pedidos que hagas con tu cuenta iniciada. Si compraste como invitado, escríbenos por WhatsApp con tu código de pedido.</p>
          <Link href="/coleccion" className="shop-button shop-button-primary">Explorar la colección <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      ) : (
        <>
          {inProgressOrder && page === 1 ? <AccountOrderRow order={inProgressOrder} current /> : null}
          {rest.map((order) => <AccountOrderRow key={order.id} order={order} />)}
          {!compact && (hasPreviousPage || hasNextPage) ? (
            <nav className="acct-pager" aria-label="Páginas de pedidos">
              <span>Página {page} · {Math.min(total, page * pageSize)} de {total}</span>
              <div>
                {hasPreviousPage ? <Link href={ordersPageHref(page - 1)}><ChevronLeft size={15} aria-hidden="true" />Anterior</Link> : null}
                {hasNextPage ? <Link href={ordersPageHref(page + 1)}>Siguiente<ChevronRight size={15} aria-hidden="true" /></Link> : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
