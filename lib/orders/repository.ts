import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
  CheckoutSource,
  WhatsAppOrderCustomerInput,
  WhatsAppOrderItemInput,
} from "./types";

interface D1RunResultLike {
  meta?: {
    last_row_id?: number | string;
  };
}

interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => {
    run: () => Promise<D1RunResultLike>;
  };
}

interface OrdersD1DatabaseLike {
  prepare: (sql: string) => D1PreparedStatementLike;
}

export interface CreateOrderRecordInput {
  source: CheckoutSource;
  items: WhatsAppOrderItemInput[];
  customer: WhatsAppOrderCustomerInput;
  clerkUserId: string | null;
}

export interface CreateOrderRecordResult {
  persisted: boolean;
  orderCode: string | null;
}

function randomDigits(size = 3) {
  return Math.floor(Math.random() * 10 ** size)
    .toString()
    .padStart(size, "0");
}

function buildOrderCode(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `GL-${year}${month}${day}-${randomDigits(3)}`;
}

async function getOrdersDb(): Promise<OrdersD1DatabaseLike | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as { GALIA_LUNA_DB?: OrdersD1DatabaseLike };
    return env.GALIA_LUNA_DB ?? null;
  } catch {
    // In local `next dev` there is no Cloudflare context; keep checkout working.
    return null;
  }
}

function safeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

export async function createWhatsAppOrderRecord({
  source,
  items,
  customer,
  clerkUserId,
}: CreateOrderRecordInput): Promise<CreateOrderRecordResult> {
  const db = await getOrdersDb();
  if (!db) {
    return { persisted: false, orderCode: null };
  }

  const orderCode = buildOrderCode();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const customerMode = clerkUserId ? "account" : "guest";

  const orderInsert = await db
    .prepare(
      `INSERT INTO orders (
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
        channel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      orderCode,
      source,
      customerMode,
      clerkUserId,
      safeText(customer.fullName, 140),
      safeText(customer.email, 180),
      safeText(customer.phone, 40),
      safeText(customer.province, 100),
      safeText(customer.city, 100),
      safeText(customer.sector, 140),
      safeText(customer.addressLine1, 200),
      safeText(customer.addressLine2, 200),
      safeText(customer.reference, 260),
      safeText(customer.deliveryNotes, 360),
      subtotal,
      "DOP",
      itemCount,
      "pending_confirmation",
      "whatsapp",
    )
    .run();

  const rawOrderId = orderInsert.meta?.last_row_id;
  const orderId = Number(rawOrderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error("No se pudo obtener el ID del pedido");
  }

  for (const item of items) {
    await db
      .prepare(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_category,
          unit_price,
          quantity,
          line_total,
          currency,
          image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        orderId,
        safeText(item.id, 120),
        safeText(item.name, 180),
        safeText(item.category, 80),
        item.price,
        item.quantity,
        item.price * item.quantity,
        "DOP",
        safeText(item.imageUrl || "", 500),
      )
      .run();
  }

  return {
    persisted: true,
    orderCode,
  };
}
