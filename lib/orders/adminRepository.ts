import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrdersPageResult,
  AdminOrderSummary,
  OrderStatus,
} from "./types";

interface D1AllResult<T> {
  results?: T[];
}

interface D1PreparedStatementBoundLike {
  run: () => Promise<{ success?: boolean }>;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<D1AllResult<T>>;
}

interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementBoundLike;
}

interface OrdersD1DatabaseLike {
  prepare: (sql: string) => D1PreparedStatementLike;
  batch: (statements: D1PreparedStatementBoundLike[]) => Promise<unknown[]>;
}

type OrderRow = {
  id: number;
  order_code: string;
  source: "cart" | "product";
  customer_mode: "account" | "guest";
  clerk_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  province: string;
  city: string;
  sector: string | null;
  address_line1: string;
  address_line2: string | null;
  reference_text: string | null;
  delivery_notes: string | null;
  subtotal_amount: number;
  currency: string;
  item_count: number;
  status: OrderStatus;
  channel: string;
  created_at: string;
  updated_at: string;
  inventory_adjusted_at?: string | null;
  inventory_adjustment_error?: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: string;
  product_name: string;
  product_category: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  currency: string;
  image_url: string | null;
};

type CountRow = {
  total: number | string;
};

async function getOrdersDb(): Promise<OrdersD1DatabaseLike | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as { GALIA_LUNA_DB?: OrdersD1DatabaseLike };
    return env.GALIA_LUNA_DB ?? null;
  } catch {
    return null;
  }
}

function mapOrderSummary(row: OrderRow): AdminOrderSummary {
  return {
    id: Number(row.id),
    orderCode: row.order_code,
    source: row.source,
    customerMode: row.customer_mode,
    clerkUserId: row.clerk_user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    province: row.province,
    city: row.city,
    subtotalAmount: Number(row.subtotal_amount),
    currency: row.currency,
    itemCount: Number(row.item_count),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    inventoryAdjustedAt: row.inventory_adjusted_at ?? null,
    inventoryAdjustmentError: row.inventory_adjustment_error ?? null,
  };
}

function mapOrderItem(row: OrderItemRow): AdminOrderItem {
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    productId: row.product_id,
    productName: row.product_name,
    productCategory: row.product_category,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    lineTotal: Number(row.line_total),
    currency: row.currency,
    imageUrl: row.image_url,
  };
}

function mapOrderDetail(row: OrderRow, items: AdminOrderItem[]): AdminOrderDetail {
  const summary = mapOrderSummary(row);
  return {
    ...summary,
    sector: row.sector ?? null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? null,
    referenceText: row.reference_text ?? null,
    deliveryNotes: row.delivery_notes ?? null,
    channel: row.channel,
    items,
  };
}

function toPositiveInt(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value ?? fallback));
}

// Pending orders older than this most likely never reached WhatsApp.
export const STALE_PENDING_HOURS = 48;

export type AdminStatusFilter = OrderStatus | "all" | "stale";

// D1 CURRENT_TIMESTAMP format ("YYYY-MM-DD HH:MM:SS", UTC), so the comparison stays a plain string compare.
function stalePendingCutoff(now = Date.now()) {
  return new Date(now - STALE_PENDING_HOURS * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
}

export function isStalePending(order: Pick<AdminOrderSummary, "status" | "createdAt">, now = Date.now()) {
  return order.status === "pending_confirmation" && order.createdAt.replace("T", " ").slice(0, 19) <= stalePendingCutoff(now);
}

function buildAdminOrderFilters(options?: {
  status?: AdminStatusFilter;
  q?: string;
}) {
  const q = (options?.q ?? "").trim();
  const status = options?.status ?? "all";

  const filters: string[] = [];
  const bindValues: unknown[] = [];

  if (status === "stale") {
    filters.push("status = 'pending_confirmation'", "created_at <= ?");
    bindValues.push(stalePendingCutoff());
  } else if (status !== "all") {
    filters.push("status = ?");
    bindValues.push(status);
  }

  if (q) {
    filters.push(
      "(order_code LIKE ? OR full_name LIKE ? OR email LIKE ? OR phone LIKE ?)",
    );
    const like = `%${q}%`;
    bindValues.push(like, like, like, like);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  return { whereClause, bindValues };
}

export async function listOrdersForAdminPage(options?: {
  status?: AdminStatusFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminOrdersPageResult> {
  const db = await getOrdersDb();
  const pageSize = Math.max(1, Math.min(toPositiveInt(options?.pageSize, 30), 100));
  const page = toPositiveInt(options?.page, 1);
  const offset = (page - 1) * pageSize;

  if (!db) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };
  }

  const { whereClause, bindValues } = buildAdminOrderFilters(options);

  const [countRow, result] = await Promise.all([
    db
      .prepare(`SELECT COUNT(*) AS total FROM orders ${whereClause}`)
      .bind(...bindValues)
      .first<CountRow>(),
    db
      .prepare(
        `SELECT
          id,
          order_code,
          source,
          customer_mode,
          clerk_user_id,
          full_name,
          email,
          phone,
          province,
          city,
          subtotal_amount,
          currency,
          item_count,
          status,
          created_at,
          updated_at,
          inventory_adjusted_at,
          inventory_adjustment_error
        FROM orders
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
      )
      .bind(...bindValues, pageSize, offset)
      .all<OrderRow>(),
  ]);

  const orders = (result.results ?? []).map(mapOrderSummary);
  const total = Number(countRow?.total ?? 0);

  return {
    orders,
    total,
    page,
    pageSize,
    hasNextPage: offset + orders.length < total,
    hasPreviousPage: page > 1,
  };
}

export async function listOrdersForAdmin(options?: {
  status?: AdminStatusFilter;
  q?: string;
  limit?: number;
}) {
  const db = await getOrdersDb();
  if (!db) return [] satisfies AdminOrderSummary[];

  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200));
  const { whereClause, bindValues } = buildAdminOrderFilters(options);
  const sql = `SELECT
      id,
      order_code,
      source,
      customer_mode,
      clerk_user_id,
      full_name,
      email,
      phone,
      province,
      city,
      subtotal_amount,
      currency,
      item_count,
      status,
      created_at,
      updated_at,
      inventory_adjusted_at,
      inventory_adjustment_error
    FROM orders
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?`;

  const result = await db
    .prepare(sql)
    .bind(...bindValues, limit)
    .all<OrderRow>();

  return (result.results ?? []).map(mapOrderSummary);
}

export async function getOrderDetailByCode(orderCode: string) {
  const db = await getOrdersDb();
  if (!db) return null;

  const order = await db
    .prepare(
      `SELECT
        id,
        order_code,
        source,
        customer_mode,
        clerk_user_id,
        full_name,
        email,
        phone,
        province,
        city,
        sector,
        address_line1,
        address_line2,
        reference_text,
        delivery_notes,
        subtotal_amount,
        currency,
        item_count,
        status,
        channel,
        created_at,
        updated_at,
        inventory_adjusted_at,
        inventory_adjustment_error
      FROM orders
      WHERE order_code = ?
      LIMIT 1`,
    )
    .bind(orderCode)
    .first<OrderRow>();

  if (!order) return null;

  const itemsResult = await db
    .prepare(
      `SELECT
        id,
        order_id,
        product_id,
        product_name,
        product_category,
        unit_price,
        quantity,
        line_total,
        currency,
        image_url
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC`,
    )
    .bind(order.id)
    .all<OrderItemRow>();

  const items = (itemsResult.results ?? []).map(mapOrderItem);

  return mapOrderDetail(order, items);
}

export async function getOrderDetailById(orderId: number) {
  const db = await getOrdersDb();
  if (!db) return null;

  const order = await db
    .prepare(
      `SELECT
        id,
        order_code,
        source,
        customer_mode,
        clerk_user_id,
        full_name,
        email,
        phone,
        province,
        city,
        sector,
        address_line1,
        address_line2,
        reference_text,
        delivery_notes,
        subtotal_amount,
        currency,
        item_count,
        status,
        channel,
        created_at,
        updated_at,
        inventory_adjusted_at,
        inventory_adjustment_error
      FROM orders
      WHERE id = ?
      LIMIT 1`,
    )
    .bind(orderId)
    .first<OrderRow>();

  if (!order) return null;

  const itemsResult = await db
    .prepare(
      `SELECT
        id,
        order_id,
        product_id,
        product_name,
        product_category,
        unit_price,
        quantity,
        line_total,
        currency,
        image_url
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC`,
    )
    .bind(order.id)
    .all<OrderItemRow>();

  return mapOrderDetail(order, (itemsResult.results ?? []).map(mapOrderItem));
}

export async function updateOrderStatusById(params: {
  orderId: number;
  nextStatus: OrderStatus;
}) {
  const db = await getOrdersDb();
  if (!db) throw new Error("D1 no disponible");

  await db
    .prepare(
      `UPDATE orders
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(params.nextStatus, params.orderId)
    .run();
}

export async function markOrderInventoryAdjustment(params: {
  orderId: number;
  adjustedAt?: string | null;
  error?: string | null;
}) {
  const db = await getOrdersDb();
  if (!db) throw new Error("D1 no disponible");

  await db
    .prepare(
      `UPDATE orders
       SET
         inventory_adjusted_at = ?,
         inventory_adjustment_error = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      params.adjustedAt ?? null,
      params.error?.slice(0, 500) ?? null,
      params.orderId,
    )
    .run();
}

// Permanent removal, triggered by an admin from the panel. Lines go first in the same D1 transaction,
// so nothing is left behind even if foreign-key cascades are off. Stock is not restored.
export async function deleteOrders(orderIds: number[]) {
  const db = await getOrdersDb();
  if (!db) throw new Error("D1 no disponible");
  const ids = [...new Set(orderIds)].filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 100);
  if (!ids.length) return 0;
  const placeholders = ids.map(() => "?").join(", ");
  await db.batch([
    db.prepare(`DELETE FROM order_items WHERE order_id IN (${placeholders})`).bind(...ids),
    db.prepare(`DELETE FROM orders WHERE id IN (${placeholders})`).bind(...ids),
  ]);
  return ids.length;
}

// Confirmed onwards counts as sold; pending is shown apart and cancelled is left out.
const SOLD_STATUSES = "'confirmed', 'in_preparation', 'shipped', 'delivered'";
// Dominican Republic is UTC-4 all year; months follow local time, not the UTC timestamps stored by D1.
const LOCAL_MONTH = "strftime('%Y-%m', created_at, '-4 hours')";

export interface AdminMonthSummary {
  month: string;
  soldOrders: number;
  soldAmount: number;
  pendingOrders: number;
  pendingAmount: number;
}

type MonthSummaryRow = {
  month: string;
  sold_orders: number | null;
  sold_amount: number | null;
  pending_orders: number | null;
  pending_amount: number | null;
};

// Local "YYYY-MM" keys for the current month and the ones before it, newest first.
export function recentLocalMonths(months: number, now = new Date()) {
  const local = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

// One grouped query over the last year; every month is returned, newest first, even without orders.
export async function getAdminMonthlySummary(months = 12, now = new Date()): Promise<AdminMonthSummary[]> {
  const keys = recentLocalMonths(months, now);
  const db = await getOrdersDb();
  const rows = db
    ? (await db
        .prepare(
          `SELECT
            ${LOCAL_MONTH} AS month,
            SUM(CASE WHEN status IN (${SOLD_STATUSES}) THEN 1 ELSE 0 END) AS sold_orders,
            SUM(CASE WHEN status IN (${SOLD_STATUSES}) THEN subtotal_amount ELSE 0 END) AS sold_amount,
            SUM(CASE WHEN status = 'pending_confirmation' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN status = 'pending_confirmation' THEN subtotal_amount ELSE 0 END) AS pending_amount
          FROM orders
          WHERE ${LOCAL_MONTH} >= ?
          GROUP BY month`,
        )
        .bind(keys[keys.length - 1])
        .all<MonthSummaryRow>()).results ?? []
    : [];
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  return keys.map((month) => {
    const row = byMonth.get(month);
    return {
      month,
      soldOrders: Number(row?.sold_orders ?? 0),
      soldAmount: Number(row?.sold_amount ?? 0),
      pendingOrders: Number(row?.pending_orders ?? 0),
      pendingAmount: Number(row?.pending_amount ?? 0),
    };
  });
}

export interface AdminExportLine {
  orderCode: string;
  productName: string;
  productCategory: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Export reads everything once (orders + lines); it runs only when an admin asks for the file.
export async function listOrdersForExport(): Promise<{ orders: AdminOrderDetail[]; lines: AdminExportLine[] }> {
  const db = await getOrdersDb();
  if (!db) return { orders: [], lines: [] };
  const [orders, lines] = await Promise.all([
    db
      .prepare(
        `SELECT
          id, order_code, source, customer_mode, clerk_user_id, full_name, email, phone,
          province, city, sector, address_line1, address_line2, reference_text, delivery_notes,
          subtotal_amount, currency, item_count, status, channel, created_at, updated_at,
          inventory_adjusted_at, inventory_adjustment_error
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5000`,
      )
      .bind()
      .all<OrderRow>(),
    db
      .prepare(
        `SELECT o.order_code, i.product_name, i.product_category, i.quantity, i.unit_price, i.line_total
        FROM order_items i
        JOIN orders o ON o.id = i.order_id
        ORDER BY o.created_at DESC, i.id ASC
        LIMIT 20000`,
      )
      .bind()
      .all<{ order_code: string; product_name: string; product_category: string | null; quantity: number; unit_price: number; line_total: number }>(),
  ]);
  return {
    orders: (orders.results ?? []).map((row) => mapOrderDetail(row, [])),
    lines: (lines.results ?? []).map((row) => ({
      orderCode: row.order_code,
      productName: row.product_name,
      productCategory: row.product_category,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.line_total),
    })),
  };
}

export async function countStalePendingOrders() {
  const db = await getOrdersDb();
  if (!db) return 0;
  const row = await db
    .prepare(`SELECT COUNT(*) AS total FROM orders WHERE status = 'pending_confirmation' AND created_at <= ?`)
    .bind(stalePendingCutoff())
    .first<CountRow>();
  return Number(row?.total ?? 0);
}
