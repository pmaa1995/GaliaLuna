import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageCircle,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import {
  ORDER_STATUS_LABELS,
  type AdminOrderDetail,
  type CustomerOrderSummary,
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

export function formatAccountOrderDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function buildCustomerOrderSupportUrl(order: {
  orderCode: string;
  status: OrderStatus;
}) {
  const text = [
    `Hola Galia Luna, necesito ayuda con mi pedido ${order.orderCode}.`,
    `Estado actual: ${ORDER_STATUS_LABELS[order.status]}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildCustomerOrderDetailHref(orderCode: string) {
  return `/mi-cuenta/pedidos/${encodeURIComponent(orderCode)}`;
}

export function AccountOrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(status)}`}
    >
      {statusIcon(status)}
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function InProgressOrderCard({
  order,
}: {
  order: CustomerOrderSummary;
}) {
  return (
    <div className="rounded-[16px] border border-[color:var(--brand-sage)]/35 bg-[color:var(--brand-sage)]/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Pedido en progreso
          </p>
          <p className="mt-2 text-base font-semibold text-[color:var(--ink)]">
            {order.orderCode}
          </p>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            {formatAccountOrderDateTime(order.createdAt)} · {order.itemCount}{" "}
            {order.itemCount === 1 ? "pieza" : "piezas"} ·{" "}
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

export function CustomerOrderDetailCard({
  order,
  showBackLink = false,
}: {
  order: AdminOrderDetail;
  showBackLink?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Pedido
          </p>
          <h2 className="mt-2 [font-family:var(--font-playfair)] text-xl leading-[0.95] text-[color:var(--ink)] sm:text-2xl">
            {order.orderCode}
          </h2>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            Creado: {formatAccountOrderDateTime(order.createdAt)}
          </p>
        </div>
        <AccountOrderStatusBadge status={order.status} />
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
        {showBackLink ? (
          <Link
            href="/mi-cuenta"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
          >
            Volver a mi cuenta
          </Link>
        ) : null}
        <a
          href={buildCustomerOrderSupportUrl(order)}
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
