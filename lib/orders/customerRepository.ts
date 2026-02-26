import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
  AdminOrderDetail,
  AdminOrderItem,
  CustomerOrderSummary,
  CustomerOrdersPageResult,
  OrderStatus,
} from "./types";

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
  status: OrderStatus;
  channel: string;
  created_at: string;
  updated_at: string;
};

type CustomerOrderListRow = {
  id: number;
  order_code: string;
  item_count: number;
  subtotal_amount: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

type CountRow = {
  total: number | string;
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
    sector: row.sector ?? null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? null,
    referenceText: row.reference_text ?? null,
    deliveryNotes: row.delivery_notes ?? null,
    channel: row.channel,
    items,
  };
}

function mapCustomerOrderSummary(row: CustomerOrderListRow): CustomerOrderSummary {
  return {
    id: Number(row.id),
    orderCode: row.order_code,
    itemCount: Number(row.item_count),
    subtotalAmount: Number(row.subtotal_amount),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPositiveInt(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

export async function listOrderSummariesForCustomerPage(params: {
  clerkUserId: string;
  page?: number;
  pageSize?: number;
}): Promise<CustomerOrdersPageResult> {
  const clerkUserId = params.clerkUserId.trim();
  const db = await getOrdersDb();
  const pageSize = Math.max(1, Math.min(toPositiveInt(params.pageSize ?? 10, 10), 50));
  const page = toPositiveInt(params.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  if (!db || !clerkUserId) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };
  }

  const [countRow, listResult] = await Promise.all([
    db
      .prepare(`SELECT COUNT(*) AS total FROM orders WHERE clerk_user_id = ?`)
      .bind(clerkUserId)
      .first<CountRow>(),
    db
      .prepare(
        `SELECT
          id,
          order_code,
          item_count,
          subtotal_amount,
          currency,
          status,
          created_at,
          updated_at
        FROM orders
        WHERE clerk_user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
      )
      .bind(clerkUserId, pageSize, offset)
      .all<CustomerOrderListRow>(),
  ]);

  const total = Number(countRow?.total ?? 0);
  const orders = (listResult.results ?? []).map(mapCustomerOrderSummary);

  return {
    orders,
    total,
    page,
    pageSize,
    hasNextPage: offset + orders.length < total,
    hasPreviousPage: page > 1,
  };
}

const IN_PROGRESS_ORDER_STATUSES: readonly OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "shipped",
] as const;

export async function getLatestInProgressOrderForCustomer(clerkUserId: string) {
  const db = await getOrdersDb();
  const userId = clerkUserId.trim();
  if (!db || !userId) return null as CustomerOrderSummary | null;

  const placeholders = IN_PROGRESS_ORDER_STATUSES.map(() => "?").join(", ");
  const row = await db
    .prepare(
      `SELECT
        id,
        order_code,
        item_count,
        subtotal_amount,
        currency,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE clerk_user_id = ?
        AND status IN (${placeholders})
      ORDER BY created_at DESC
      LIMIT 1`,
    )
    .bind(userId, ...IN_PROGRESS_ORDER_STATUSES)
    .first<CustomerOrderListRow>();

  return row ? mapCustomerOrderSummary(row) : null;
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
