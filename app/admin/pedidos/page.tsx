import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Package,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { requireAdminUser } from "../../../lib/admin/auth";
import {
  getOrderDetailByCode,
  listOrdersForAdminPage,
} from "../../../lib/orders/adminRepository";
import { getAllowedNextStatuses } from "../../../lib/orders/status";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type OrderStatus,
} from "../../../lib/orders/types";
import { WHATSAPP_OWNER_NUMBER } from "../../../lib/contact";
import { formatDOP } from "../../../types/product";
import {
  retryInventoryAdjustmentAction,
  updateAdminOrderStatusAction,
} from "./actions";

type PageSearchParams = {
  estado?: string | string[];
  q?: string | string[];
  pedido?: string | string[];
  page?: string | string[];
};

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatusFilter(value: string | undefined): OrderStatus | "all" {
  if (!value) return "all";
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "all";
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

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
    `Hola Galia Luna, necesito ayuda con el pedido ${order.orderCode}.`,
    `Estado actual: ${ORDER_STATUS_LABELS[order.status]}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildReturnTo(params: {
  status: OrderStatus | "all";
  q: string;
  page?: number;
  selectedOrderCode?: string;
}) {
  const search = new URLSearchParams();
  if (params.status !== "all") search.set("estado", params.status);
  if (params.q.trim()) search.set("q", params.q.trim());
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.selectedOrderCode) search.set("pedido", params.selectedOrderCode);

  const query = search.toString();
  return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
}

function StatusActionButton({
  order,
  nextStatus,
  returnTo,
}: {
  order: AdminOrderSummary;
  nextStatus: OrderStatus;
  returnTo: string;
}) {
  return (
    <form action={updateAdminOrderStatusAction}>
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)]"
      >
        {ORDER_STATUS_LABELS[nextStatus]}
      </button>
    </form>
  );
}

function InventoryStatusNote({ order }: { order: AdminOrderSummary | AdminOrderDetail }) {
  if (order.status !== "confirmed") {
    return (
      <p className="text-xs text-[color:var(--ink-soft)]">
        El inventario se descuenta al confirmar el pedido.
      </p>
    );
  }

  if (order.inventoryAdjustedAt) {
    return (
      <p className="text-xs text-[color:var(--ink-soft)]">
        Inventario ajustado: {formatDateTime(order.inventoryAdjustedAt)}
      </p>
    );
  }

  if (order.inventoryAdjustmentError) {
    return (
      <p className="text-xs text-[color:var(--brand-coral)]">
        Inventario pendiente: {order.inventoryAdjustmentError}
      </p>
    );
  }

  return (
    <p className="text-xs text-[color:var(--ink-soft)]">
      Inventario pendiente de ajuste.
    </p>
  );
}

function OrderDetailPanel({
  order,
  returnTo,
}: {
  order: AdminOrderDetail | null;
  returnTo: string;
}) {
  if (!order) {
    return (
      <aside className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
          Detalle de pedido
        </p>
        <h2 className="mt-3 [font-family:var(--font-playfair)] text-[1.9rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
          Selecciona un pedido
        </h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
          Haz clic en “Ver detalle” en la lista para revisar productos, dirección y actualizar estados.
        </p>
      </aside>
    );
  }

  const supportUrl = buildOrderSupportUrl(order);
  const nextStatuses = getAllowedNextStatuses(order.status);

  return (
    <aside className="space-y-4">
      <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Pedido
            </p>
            <h2 className="mt-2 [font-family:var(--font-playfair)] text-[1.9rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
              {order.orderCode}
            </h2>
            <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
              Creado: {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${statusBadgeClass(order.status)}`}
          >
            {statusIcon(order.status)}
            {ORDER_STATUS_LABELS[order.status]}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
              Cliente
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
              {order.fullName}
            </p>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{order.phone}</p>
            <p className="mt-1 break-all text-sm text-[color:var(--ink-soft)]">
              {order.email || "Sin correo"}
            </p>
            <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
              Modo: {order.customerMode === "account" ? "Cuenta" : "Invitado"}
            </p>
          </div>

          <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
              Entrega
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
              {order.province}, {order.city}
            </p>
            {order.sector ? (
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{order.sector}</p>
            ) : null}
            <p className="mt-2 text-sm text-[color:var(--ink)]">{order.addressLine1}</p>
            {order.addressLine2 ? (
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{order.addressLine2}</p>
            ) : null}
          </div>
        </div>

        {order.referenceText || order.deliveryNotes ? (
          <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
              Referencia e instrucciones
            </p>
            {order.referenceText ? (
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                Referencia: {order.referenceText}
              </p>
            ) : null}
            {order.deliveryNotes ? (
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                Instrucciones: {order.deliveryNotes}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => (
            <StatusActionButton
              key={nextStatus}
              order={order}
              nextStatus={nextStatus}
              returnTo={returnTo}
            />
          ))}

          {order.status === "confirmed" && !order.inventoryAdjustedAt ? (
            <form action={retryInventoryAdjustmentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-[color:var(--brand-sage)]/35 bg-[color:var(--brand-sage)]/16 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
              >
                Reintentar inventario
              </button>
            </form>
          ) : null}

          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
          >
            WhatsApp del pedido
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
          <InventoryStatusNote order={order} />
        </div>
      </section>

      <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Productos
            </p>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              {order.itemCount} {order.itemCount === 1 ? "pieza" : "piezas"} ·{" "}
              {formatDOP(order.subtotalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink)]">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                    {item.productCategory || "Pieza"} · ID {item.productId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[color:var(--ink)]">
                    {item.quantity} x {formatDOP(item.unitPrice)}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                    {formatDOP(item.lineTotal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function OrderRow({
  order,
  isSelected,
  returnBase,
}: {
  order: AdminOrderSummary;
  isSelected: boolean;
  returnBase: string;
}) {
  const nextStatuses = getAllowedNextStatuses(order.status);
  const detailParams = new URLSearchParams(returnBase.split("?")[1] ?? "");
  detailParams.set("pedido", order.orderCode);
  const detailUrl = `/admin/pedidos?${detailParams.toString()}`;
  const supportUrl = buildOrderSupportUrl(order);

  return (
    <article
      className={`rounded-[16px] border p-4 ${
        isSelected
          ? "border-[color:var(--line-strong)] bg-[color:var(--paper)]"
          : "border-[color:var(--line)] bg-[color:var(--paper)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[color:var(--ink)]">{order.orderCode}</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusBadgeClass(order.status)}`}
            >
              {statusIcon(order.status)}
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-[color:var(--ink)]">{order.fullName}</p>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            {order.phone} · {order.city}, {order.province}
          </p>
          <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
            {formatDateTime(order.createdAt)} · {order.itemCount} piezas ·{" "}
            {formatDOP(order.subtotalAmount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={detailUrl}
            className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)]"
          >
            Ver detalle
          </Link>
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
          >
            WhatsApp
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {nextStatuses.map((nextStatus) => (
          <StatusActionButton
            key={`${order.id}-${nextStatus}`}
            order={order}
            nextStatus={nextStatus}
            returnTo={isSelected ? detailUrl : returnBase}
          />
        ))}
      </div>

      <div className="mt-3">
        <InventoryStatusNote order={order} />
      </div>
    </article>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const adminUser = await requireAdminUser();

  const rawStatus = pickFirst(searchParams?.estado);
  const statusFilter = parseStatusFilter(rawStatus);
  const q = (pickFirst(searchParams?.q) ?? "").trim();
  const selectedOrderCode = (pickFirst(searchParams?.pedido) ?? "").trim();
  const page = parsePage(pickFirst(searchParams?.page));

  const [ordersPage, selectedOrder] = await Promise.all([
    listOrdersForAdminPage({
      status: statusFilter,
      q,
      page,
      pageSize: 30,
    }),
    selectedOrderCode ? getOrderDetailByCode(selectedOrderCode) : Promise.resolve(null),
  ]);
  const { orders, total, hasNextPage, hasPreviousPage } = ordersPage;

  const returnBase = buildReturnTo({ status: statusFilter, q, page: ordersPage.page });
  const selectedReturnTo = buildReturnTo({
    status: statusFilter,
    q,
    page: ordersPage.page,
    selectedOrderCode:
      selectedOrder?.orderCode ?? (selectedOrderCode || undefined),
  });
  const adminEmail =
    adminUser.primaryEmailAddress?.emailAddress ??
    adminUser.emailAddresses?.[0]?.emailAddress ??
    "Admin";

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Panel interno
          </p>
          <h1 className="mt-2 [font-family:var(--font-playfair)] text-[2.1rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
            Pedidos de la web
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
            Acceso admin: {adminEmail}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 py-2 text-xs text-[color:var(--ink)]">
            <ShieldCheck className="h-4 w-4" />
            Solo admins
          </span>
          <Link
            href="/mi-cuenta"
            className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
          >
            Mi cuenta
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <section className="space-y-4">
          <form
            method="GET"
            className="flex flex-col gap-3 border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:flex-row sm:items-end"
          >
            <label className="block flex-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Buscar pedido / cliente
              </span>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="GL-..., nombre, correo o telefono"
                  className="h-11 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] pl-9 pr-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--brand-sage)]"
                />
              </div>
            </label>

            <label className="block sm:w-[14rem]">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Estado
              </span>
              <select
                name="estado"
                defaultValue={statusFilter}
                className="mt-2 h-11 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--brand-sage)]"
              >
                <option value="all">Todos</option>
                {ORDER_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--brand-sage)] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Filtrar
            </button>
            <Link
              href="/admin/pedidos"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Limpiar
            </Link>
          </form>

          <div className="border border-[color:var(--line)] bg-[color:var(--panel)] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[color:var(--ink-soft)]">
                {total} {total === 1 ? "pedido" : "pedidos"} encontrados
              </p>
              <p className="text-xs text-[color:var(--ink-soft)]">
                Estados e inventario se gestionan desde este panel. Se cargan 30 por pagina para mantenerlo rapido.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--paper)] p-5 text-sm text-[color:var(--ink-soft)]">
                No hay pedidos con ese filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isSelected={selectedOrder?.id === order.id}
                    returnBase={returnBase}
                  />
                ))}
              </div>
            )}

            {(hasPreviousPage || hasNextPage) && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--line)] pt-4">
                <p className="text-xs text-[color:var(--ink-soft)]">
                  Pagina {ordersPage.page} · {Math.min(total, ordersPage.page * ordersPage.pageSize)} de {total}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasPreviousPage ? (
                    <Link
                      href={buildReturnTo({
                        status: statusFilter,
                        q,
                        page: ordersPage.page - 1,
                        selectedOrderCode: selectedOrder?.orderCode,
                      })}
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
                      href={buildReturnTo({
                        status: statusFilter,
                        q,
                        page: ordersPage.page + 1,
                        selectedOrderCode: selectedOrder?.orderCode,
                      })}
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
            )}
          </div>
        </section>

        <OrderDetailPanel order={selectedOrder} returnTo={selectedReturnTo} />
      </div>
    </main>
  );
}
