import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CheckoutSource, WhatsAppOrderCustomerInput, WhatsAppOrderItemInput } from "./types";

interface D1RunResultLike { success: boolean; }
interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
}
interface OrdersD1DatabaseLike {
  prepare: (sql: string) => D1PreparedStatementLike;
  batch: (statements: D1PreparedStatementLike[]) => Promise<D1RunResultLike[]>;
}

export interface CreateOrderRecordInput {
  source: CheckoutSource;
  items: WhatsAppOrderItemInput[];
  customer: WhatsAppOrderCustomerInput;
  clerkUserId: string | null;
}
export interface CreateOrderRecordResult { persisted: boolean; orderCode: string | null; }

function buildOrderCode(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const unique = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `GL-${date}-${unique}`;
}

async function getOrdersDb(): Promise<OrdersD1DatabaseLike | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    return (context.env as { GALIA_LUNA_DB?: OrdersD1DatabaseLike }).GALIA_LUNA_DB ?? null;
  } catch {
    return null;
  }
}

function safeText(value: string, max: number) { return value.trim().slice(0, max); }

export async function createWhatsAppOrderRecord({
  source, items, customer, clerkUserId,
}: CreateOrderRecordInput): Promise<CreateOrderRecordResult> {
  const db = await getOrdersDb();
  if (!db) return { persisted: false, orderCode: null };
  if (items.length === 0) throw new Error("El pedido no contiene productos");

  const orderCode = buildOrderCode();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const orderInsert = db.prepare(
    `INSERT INTO orders (
      order_code, source, customer_mode, clerk_user_id, full_name, email, phone,
      province, city, sector, address_line1, address_line2, reference_text,
      delivery_notes, subtotal_amount, currency, item_count, status, channel
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    orderCode, source, clerkUserId ? "account" : "guest", clerkUserId,
    safeText(customer.fullName, 140), safeText(customer.email, 180), safeText(customer.phone, 40),
    safeText(customer.province, 100), safeText(customer.city, 100), safeText(customer.sector, 140),
    safeText(customer.addressLine1, 200), safeText(customer.addressLine2, 200),
    safeText(customer.reference, 260), safeText(customer.deliveryNotes, 360),
    subtotal, "DOP", itemCount, "pending_confirmation", "whatsapp",
  );

  // D1 batches are transactions: either the order and every line are committed, or all roll back.
  // Resolve the parent by its unique code within the batch; last_insert_rowid changes after each line.
  const lineInserts = items.map((item) => db.prepare(
    `INSERT INTO order_items (
      order_id, product_id, product_name, product_category, unit_price, quantity,
      line_total, currency, image_url
    ) VALUES ((SELECT id FROM orders WHERE order_code = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    orderCode, safeText(item.id, 120), safeText(item.name, 180), safeText(item.category, 80),
    item.price, item.quantity, Math.round(item.price * 100) * item.quantity / 100,
    "DOP", safeText(item.imageUrl || "", 500),
  ));

  const results = await db.batch([orderInsert, ...lineInserts]);
  if (results.length !== items.length + 1 || results.some((result) => !result.success)) {
    throw new Error("No se pudo guardar el pedido completo");
  }
  return { persisted: true, orderCode };
}
