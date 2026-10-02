import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, Phone, Search, X } from "lucide-react";

import { retryInventoryAdjustmentAction, updateAdminOrderStatusAction } from "../../app/admin/pedidos/actions";
import { getAllowedNextStatuses } from "../../lib/orders/status";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type OrderStatus,
} from "../../lib/orders/types";
import { formatDOP } from "../../types/product";
import { AccountOrderStatusBadge, formatAccountOrderDateTime, formatPieces } from "../account/orderUi";

// Buttons name the action, not the resulting state.
const STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Volver a pendiente",
  confirmed: "Confirmar",
  in_preparation: "Pasar a preparación",
  shipped: "Marcar enviado",
  delivered: "Marcar entregado",
  cancelled: "Cancelar",
};

const STATUS_FILTER_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Pendientes",
  confirmed: "Confirmados",
  in_preparation: "En preparación",
  shipped: "Enviados",
  delivered: "Entregados",
  cancelled: "Cancelados",
};

export function buildAdminOrdersHref(params: { status: OrderStatus | "all"; q: string; page?: number; selectedOrderCode?: string }) {
  const search = new URLSearchParams();
  if (params.status !== "all") search.set("estado", params.status);
  if (params.q.trim()) search.set("q", params.q.trim());
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.selectedOrderCode) search.set("pedido", params.selectedOrderCode);
  const query = search.toString();
  return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
}

// Dominican numbers are stored in local 10-digit form; wa.me needs the country code.
export function customerWhatsAppUrl(order: Pick<AdminOrderSummary, "phone" | "fullName" | "orderCode">) {
  const digits = order.phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `1${digits}` : digits.length === 11 && digits.startsWith("1") ? digits : "";
  if (!number) return null;
  const firstName = order.fullName.trim().split(/\s+/)[0] ?? "";
  const text = `Hola${firstName ? ` ${firstName}` : ""}, te escribimos de Galia Luna sobre tu pedido ${order.orderCode}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function StatusActions({ order, returnTo }: { order: AdminOrderSummary; returnTo: string }) {
  return <>
    {getAllowedNextStatuses(order.status).map((nextStatus) => nextStatus === "cancelled" ? (
      <details key={nextStatus} className="adm-cancel">
        <summary className="adm-btn adm-btn--danger"><span className="adm-cancel-open">Cancelar</span><span className="adm-cancel-close">No cancelar</span></summary>
        <form action={updateAdminOrderStatusAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="nextStatus" value={nextStatus} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <span>¿Cancelar {order.orderCode}?</span>
          <button type="submit" className="adm-btn adm-btn--confirm">Sí, cancelar</button>
        </form>
      </details>
    ) : (
      <form key={nextStatus} action={updateAdminOrderStatusAction}>
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="nextStatus" value={nextStatus} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="adm-btn adm-btn--primary">{STATUS_ACTION_LABELS[nextStatus]}</button>
      </form>
    ))}
  </>;
}

function InventoryNote({ order }: { order: AdminOrderSummary | AdminOrderDetail }) {
  if (order.status === "pending_confirmation") return <p className="adm-note">El inventario se descuenta al confirmar.</p>;
  if (order.status !== "confirmed") return null;
  if (order.inventoryAdjustedAt) return <p className="adm-note">Inventario ajustado el {formatAccountOrderDateTime(order.inventoryAdjustedAt)}.</p>;
  return <p className="adm-note adm-note--warn">Inventario pendiente{order.inventoryAdjustmentError ? `: ${order.inventoryAdjustmentError}` : "."}</p>;
}

function WhatsAppButton({ order }: { order: AdminOrderSummary }) {
  const url = customerWhatsAppUrl(order);
  return url ? <a className="adm-btn" href={url} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} aria-hidden="true" />WhatsApp</a> : null;
}

function OrderDetail({ order, returnTo, closeHref }: { order: AdminOrderDetail; returnTo: string; closeHref: string }) {
  return (
    <aside className="adm-detail" id="detalle" aria-labelledby="adm-detail-title">
      <div className="adm-detail-top">
        <div>
          <AccountOrderStatusBadge status={order.status} />
          <h2 id="adm-detail-title">{order.orderCode}</h2>
          <p>{formatAccountOrderDateTime(order.createdAt)} · {order.customerMode === "account" ? "Con cuenta" : "Invitado"}</p>
        </div>
        <Link href={closeHref} className="adm-detail-close" aria-label="Cerrar detalle"><X size={20} /></Link>
      </div>
      <div className="adm-actions">
        <StatusActions order={order} returnTo={returnTo} />
        {order.status === "confirmed" && !order.inventoryAdjustedAt ? (
          <form action={retryInventoryAdjustmentAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="adm-btn">Reintentar inventario</button>
          </form>
        ) : null}
      </div>
      <InventoryNote order={order} />

      <h3>Cliente</h3>
      <div className="adm-detail-block">
        <p>{order.fullName}</p>
        <p><a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}>{order.phone}</a>{order.email ? <span> · {order.email}</span> : null}</p>
      </div>
      <div className="adm-actions">
        <WhatsAppButton order={order} />
        <a className="adm-btn" href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}><Phone size={15} aria-hidden="true" />Llamar</a>
      </div>

      <h3>Entrega</h3>
      <div className="adm-detail-block">
        <p>{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}</p>
        <p>{[order.sector, order.city, order.province].filter(Boolean).join(", ")}</p>
        {order.referenceText ? <p><span>Referencia:</span> {order.referenceText}</p> : null}
        {order.deliveryNotes ? <p><span>Instrucciones:</span> {order.deliveryNotes}</p> : null}
      </div>

      <h3>Piezas · {formatPieces(order.itemCount)}</h3>
      <ul className="acct-items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>{item.productName}<small>{item.productCategory || "Pieza"} · {item.quantity} × {formatDOP(item.unitPrice)}</small></span>
            <span>{formatDOP(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="acct-total"><span>Total</span><span>{formatDOP(order.subtotalAmount)}</span></p>
    </aside>
  );
}

export interface AdminOrdersViewProps {
  adminEmail: string;
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  statusFilter: OrderStatus | "all";
  q: string;
  selectedOrder: AdminOrderDetail | null;
}

export default function AdminOrdersView({ adminEmail, orders, total, page, pageSize, hasPreviousPage, hasNextPage, statusFilter, q, selectedOrder }: AdminOrdersViewProps) {
  const listHref = buildAdminOrdersHref({ status: statusFilter, q, page });
  const detailHref = (orderCode: string) => `${buildAdminOrdersHref({ status: statusFilter, q, page, selectedOrderCode: orderCode })}#detalle`;
  const selectedReturnTo = selectedOrder ? buildAdminOrdersHref({ status: statusFilter, q, page, selectedOrderCode: selectedOrder.orderCode }) : listHref;
  return (
    <div className="acct shop-container">
      <Link href="/mi-cuenta" className="acct-back"><ChevronLeft size={15} aria-hidden="true" />Mi cuenta</Link>
      <header className="adm-head">
        <div>
          <p className="shop-eyebrow">PANEL INTERNO</p>
          <h1>Pedidos</h1>
          <p>Sesión de administración: {adminEmail}</p>
        </div>
      </header>

      <div className="adm-filters">
        <form method="GET" action="/admin/pedidos" className="adm-search" role="search">
          {statusFilter !== "all" ? <input type="hidden" name="estado" value={statusFilter} /> : null}
          <label className="sr-only" htmlFor="adm-q">Buscar pedido o cliente</label>
          <input id="adm-q" type="search" name="q" defaultValue={q} placeholder="Buscar pedido o cliente" />
          <button type="submit" className="adm-btn adm-btn--primary" aria-label="Buscar"><Search size={17} /></button>
        </form>
        <nav className="adm-chips" aria-label="Filtrar por estado">
          <Link href={buildAdminOrdersHref({ status: "all", q })} aria-current={statusFilter === "all" ? "page" : undefined}>Todos</Link>
          {ORDER_STATUS_VALUES.map((status) => (
            <Link key={status} href={buildAdminOrdersHref({ status, q })} aria-current={statusFilter === status ? "page" : undefined}>{STATUS_FILTER_LABELS[status]}</Link>
          ))}
        </nav>
      </div>
      <div className="adm-summary">
        <span>{total} {total === 1 ? "pedido" : "pedidos"}{statusFilter !== "all" ? ` · ${ORDER_STATUS_LABELS[statusFilter].toLocaleLowerCase("es")}` : ""}{q ? ` · «${q}»` : ""}</span>
        {q || statusFilter !== "all" ? <Link href="/admin/pedidos">Quitar filtros</Link> : null}
      </div>

      <div className="adm-layout">
        <section aria-label="Lista de pedidos">
          {orders.length === 0 ? <p className="adm-empty">No hay pedidos con ese filtro.</p> : orders.map((order) => {
            const selected = selectedOrder?.id === order.id;
            return (
              <article key={order.id} className="adm-order" aria-current={selected ? "true" : undefined}>
                <Link href={detailHref(order.orderCode)} className="adm-order-link">
                  <span className="adm-order-code">{order.orderCode}</span>
                  <AccountOrderStatusBadge status={order.status} />
                  <p className="adm-order-name">{order.fullName}</p>
                  <p>{order.phone} · {order.city}, {order.province}</p>
                  <p>{formatAccountOrderDateTime(order.createdAt)} · {formatPieces(order.itemCount)} · {formatDOP(order.subtotalAmount)}</p>
                </Link>
                <div className="adm-actions">
                  <StatusActions order={order} returnTo={selected ? selectedReturnTo : listHref} />
                  <WhatsAppButton order={order} />
                </div>
                {order.status === "confirmed" && !order.inventoryAdjustedAt ? <InventoryNote order={order} /> : null}
              </article>
            );
          })}
          {hasPreviousPage || hasNextPage ? (
            <nav className="acct-pager" aria-label="Páginas de pedidos">
              <span>Página {page} · {Math.min(total, page * pageSize)} de {total}</span>
              <div>
                {hasPreviousPage ? <Link href={buildAdminOrdersHref({ status: statusFilter, q, page: page - 1 })}><ChevronLeft size={15} aria-hidden="true" />Anterior</Link> : null}
                {hasNextPage ? <Link href={buildAdminOrdersHref({ status: statusFilter, q, page: page + 1 })}>Siguiente<ChevronRight size={15} aria-hidden="true" /></Link> : null}
              </div>
            </nav>
          ) : null}
        </section>

        {selectedOrder ? <OrderDetail order={selectedOrder} returnTo={selectedReturnTo} closeHref={listHref} /> : (
          <div className="adm-detail-placeholder"><strong>Elige un pedido</strong>Toca cualquier pedido de la lista para ver el cliente, la dirección y las piezas.</div>
        )}
      </div>
    </div>
  );
}
