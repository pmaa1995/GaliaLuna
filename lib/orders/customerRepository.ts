import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { AdminOrderDetail, AdminOrderItem, AdminOrderSummary } from "./types";

interface D1AllResult<T> {
  results?: T[];
}

interface D1PreparedStatementBoundLike {
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<D1AllResult<T>>;
}

interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementBoundLike;
}

interface OrdersD1DatabaseLike {
  prepare: (sql: string) => D1PreparedStatementLike;
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
  status: AdminOrderSummary["status"];
  channel: string;
  created_at: string;
  updated_at: string;
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
    inventoryAdjustedAt: null,
    inventoryAdjustmentError: null,
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
  return {
    ...mapOrderSummary(row),
    sector: row.sector ?? null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? null,
    referenceText: row.reference_text ?? null,
    deliveryNotes: row.delivery_notes ?? null,
    channel: row.channel,
    items,
  };
}

export async function listOrdersForCustomer(clerkUserId: string, limit = 20) {
  const db = await getOrdersDb();
  if (!db || !clerkUserId.trim()) return [] as AdminOrderSummary[];

  const cappedLimit = Math.max(1, Math.min(limit, 50));
  const result = await db
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
        updated_at
      FROM orders
      WHERE clerk_user_id = ?
      ORDER BY created_at DESC
      LIMIT ?`,
    )
    .bind(clerkUserId, cappedLimit)
    .all<OrderRow>();

  return (result.results ?? []).map(mapOrderSummary);
}

export async function getOrderDetailByCodeForCustomer(
  clerkUserId: string,
  orderCode: string,
) {
  const db = await getOrdersDb();
  if (!db || !clerkUserId.trim() || !orderCode.trim()) return null;

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
        updated_at
      FROM orders
      WHERE order_code = ?
        AND clerk_user_id = ?
      LIMIT 1`,
    )
    .bind(orderCode.trim(), clerkUserId.trim())
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
