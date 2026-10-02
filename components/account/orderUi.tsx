import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { STORE_TIME_ZONE, parseStoredDate } from "../../lib/orders/dates";
import {
  ORDER_STATUS_LABELS,
  type AdminOrderDetail,
  type CustomerOrderSummary,
  type OrderStatus,
} from "../../lib/orders/types";
import { formatDOP } from "../../types/product";

const STATUS_ICONS = {
  pending_confirmation: Clock3,
  confirmed: CheckCircle2,
  in_preparation: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
} satisfies Record<OrderStatus, typeof Clock3>;

// Badges use short labels so they fit beside order details on phones.
const STATUS_BADGE_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Por confirmar",
  confirmed: "Confirmado",
  in_preparation: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function formatAccountOrderDateTime(value: string) {
  const date = parseStoredDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: STORE_TIME_ZONE,
  }).format(date);
}

export function formatPieces(count: number) {
  return `${count} ${count === 1 ? "pieza" : "piezas"}`;
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
  const Icon = STATUS_ICONS[status] ?? Clock3;
  return (
    <span className={`acct-status acct-status--${status}`}>
      <Icon size={13} aria-hidden="true" />
      {STATUS_BADGE_LABELS[status]}
    </span>
  );
}

export function AccountOrderRow({
  order,
  current = false,
}: {
  order: CustomerOrderSummary;
  current?: boolean;
}) {
  return (
    <Link
      href={buildCustomerOrderDetailHref(order.orderCode)}
      className={`acct-order${current ? " acct-order--current" : ""}`}
    >
      <span className="acct-order-code">
        {current ? <span className="acct-order-tag">Pedido en curso</span> : null}
        {order.orderCode}
      </span>
      <span className="acct-order-meta">
        {formatAccountOrderDateTime(order.createdAt)} · {formatPieces(order.itemCount)} ·{" "}
        {formatDOP(order.subtotalAmount)}
      </span>
      <AccountOrderStatusBadge status={order.status} />
    </Link>
  );
}

export function CustomerOrderDetailCard({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="acct-detail-grid">
      <section aria-labelledby="order-items-title">
        <div className="acct-section-head">
          <h2 id="order-items-title">Piezas</h2>
          <span className="acct-order-meta">{formatPieces(order.itemCount)}</span>
        </div>
        <ul className="acct-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.productName}
                <small>
                  {item.productCategory || "Pieza"} · {item.quantity}{" "}
                  {item.quantity === 1 ? "unidad" : "unidades"}
                </small>
              </span>
              <span>{formatDOP(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="acct-total">
          <span>Total estimado</span>
          <span>{formatDOP(order.subtotalAmount)}</span>
        </p>
      </section>

      <section aria-labelledby="order-delivery-title">
        <div className="acct-section-head">
          <h2 id="order-delivery-title">Entrega</h2>
        </div>
        <div className="acct-address">
          <p>{order.addressLine1}</p>
          {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
          <p>
            {[order.sector, order.city, order.province].filter(Boolean).join(", ")}
          </p>
          {order.referenceText ? <p><span>Referencia:</span> {order.referenceText}</p> : null}
          {order.deliveryNotes ? <p><span>Instrucciones:</span> {order.deliveryNotes}</p> : null}
        </div>
        <div className="acct-detail-actions">
          <a
            href={buildCustomerOrderSupportUrl(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="shop-button shop-button-secondary"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Preguntar por este pedido
          </a>
          <Link href="/mi-cuenta/pedidos" className="shop-button shop-button-outline">
            Ver todos mis pedidos <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
