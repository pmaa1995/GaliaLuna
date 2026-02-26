import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageCircle,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import {
  getOrderDetailByCodeForCustomer,
  listOrdersForCustomer,
} from "../../lib/orders/customerRepository";
import {
  ORDER_STATUS_LABELS,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type OrderStatus,
} from "../../lib/orders/types";
import { formatDOP } from "../../types/product";

function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "pending_confirmation":
      return "border-[color:var(--brand-sand)]/65 bg-[color:var(--brand-sand)]/35 text-[color:var(--ink)]";
    case "confirmed":
      return "border-[color:var(--brand-sage)]/45 bg-[color:var(--brand-sage)]/18 text-[color:var(--ink)]";
    case "in_preparation":
      return "border-[color:var(--band-sky)]/45 bg-[color:var(--band-sky)]/18 text-[color:var(--ink)]";
    case "shipped":
      return "border-[color:var(--line-strong)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]";
    case "delivered":
      return "border-[color:var(--brand-sage)]/55 bg-[color:var(--brand-sage)]/22 text-[color:var(--ink)]";
    case "cancelled":
      return "border-[color:var(--brand-coral)]/45 bg-[color:var(--brand-coral)]/16 text-[color:var(--ink)]";
    default:
      return "border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]";
  }
}

function statusIcon(status: OrderStatus) {
  switch (status) {
    case "pending_confirmation":
      return <Clock3 className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "in_preparation":
      return <Package className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle2 className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock3 className="h-4 w-4" />;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildOrderSupportUrl(order: Pick<AdminOrderSummary, "orderCode" | "status">) {
  const text = [
    `Hola Galia Luna, necesito ayuda con mi pedido ${order.orderCode}.`,
    `Estado actual: ${ORDER_STATUS_LABELS[order.status]}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildOrderDetailHref(orderCode: string) {
  return `/mi-cuenta?pedido=${encodeURIComponent(orderCode)}`;
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(status)}`}
    >
      {statusIcon(status)}
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function OrderDetailView({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Pedido seleccionado
          </p>
          <h3 className="mt-2 [font-family:var(--font-playfair)] text-xl leading-[0.95] text-[color:var(--ink)] sm:text-2xl">
            {order.orderCode}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            Creado: {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Entrega
          </p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-[color:var(--ink)]">
            <p>
              {order.province}, {order.city}
              {order.sector ? `, ${order.sector}` : ""}
            </p>
            <p>{order.addressLine1}</p>
            {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
            {order.referenceText ? (
              <p className="text-[color:var(--ink-soft)]">
                Referencia: {order.referenceText}
              </p>
            ) : null}
            {order.deliveryNotes ? (
              <p className="text-[color:var(--ink-soft)]">
                Instrucciones: {order.deliveryNotes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Piezas del pedido
          </p>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3"
              >
                <div>
                  <p className="text-sm font-medium leading-6 text-[color:var(--ink)]">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[color:var(--ink-soft)]">
                    {item.productCategory || "Pieza"} · {item.quantity}{" "}
                    {item.quantity === 1 ? "unidad" : "unidades"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-[color:var(--ink)]">
                  {formatDOP(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-[color:var(--line)] pt-3">
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Total estimado
            </p>
            <p className="text-base font-semibold text-[color:var(--ink)]">
              {formatDOP(order.subtotalAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={buildOrderSupportUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Soporte por WhatsApp
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
        Solo se muestran los pedidos realizados mientras iniciaste sesion. Si pediste como invitado, puedes escribir por WhatsApp y compartir el codigo de pedido para seguimiento.
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
          href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`}
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
  selectedOrderCode,
}: {
  clerkUserId: string;
  selectedOrderCode?: string;
}) {
  const orders = await listOrdersForCustomer(clerkUserId, 25);
  const fallbackSelected = orders[0]?.orderCode;
  const effectiveSelectedCode = selectedOrderCode || fallbackSelected;

  const selectedOrder = effectiveSelectedCode
    ? await getOrderDetailByCodeForCustomer(clerkUserId, effectiveSelectedCode)
    : null;

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

      {orders.length === 0 ? (
        <div className="mt-5">
          <OrdersEmptyState />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[color:var(--ink-soft)]">
                {orders.length} {orders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
              </p>
              <p className="text-xs text-[color:var(--ink-soft)]">
                Se muestran los pedidos hechos con tu cuenta.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {orders.map((order) => {
                const active = selectedOrder?.orderCode === order.orderCode;

                return (
                  <div
                    key={order.id}
                    className={`rounded-[14px] border p-4 transition ${
                      active
                        ? "border-[color:var(--brand-sage)]/35 bg-[color:var(--brand-sage)]/10"
                        : "border-[color:var(--line)] bg-[color:var(--paper)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          {order.orderCode}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                          {formatDateTime(order.createdAt)} · {order.itemCount}{" "}
                          {order.itemCount === 1 ? "pieza" : "piezas"} ·{" "}
                          {formatDOP(order.subtotalAmount)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={buildOrderDetailHref(order.orderCode)}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                      >
                        Ver detalle
                      </Link>
                      <a
                        href={buildOrderSupportUrl(order)}
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
              })}
            </div>
          </div>

          {selectedOrder ? (
            <OrderDetailView order={selectedOrder} />
          ) : effectiveSelectedCode ? (
            <div className="rounded-[16px] border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)]/10 p-4 text-sm text-[color:var(--ink)]">
              No encontramos ese pedido dentro de tu cuenta.
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
