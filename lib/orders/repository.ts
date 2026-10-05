import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CheckoutSource, WhatsAppOrderCustomerInput, WhatsAppOrderItemInput } from "./types";

interface D1RunResultLike { success: boolean; }
interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
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
export interface CreateOrderRecordResult {
  persisted: boolean;
  orderCode: string | null;
  // Too many recent orders from the same phone; nothing was saved.
  throttled?: boolean;
}

// The same order sent again (same phone, total and pieces) within this window reuses the first code.
const DUPLICATE_WINDOW_MINUTES = 10;
// A phone may place at most this many orders within the window; more looks like spam or a mistake.
const PHONE_WINDOW_MINUTES = 15;
const MAX_ORDERS_PER_PHONE = 3;

// Compares the last 10 digits, so "809-555-1234", "(809) 5551234" and "+1 809 555 1234" match.
const PHONE_DIGITS_SQL = "substr(replace(replace(replace(replace(replace(replace(phone, '-', ''), ' ', ''), '(', ''), ')', ''), '+', ''), '.', ''), -10)";

// Matches D1's CURRENT_TIMESTAMP format ("YYYY-MM-DD HH:MM:SS", UTC).
function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString().replace("T", " ").slice(0, 19);
}

type RecentOrderRow = { order_code: string; subtotal_amount: number; item_count: number; status: string; created_at: string };

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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const phoneKey = customer.phone.replace(/\D/g, "").slice(-10);
  const recent = (await db
    .prepare(
      `SELECT order_code, subtotal_amount, item_count, status, created_at
       FROM orders
       WHERE created_at >= ? AND ${PHONE_DIGITS_SQL} = ?
       ORDER BY created_at DESC
       LIMIT 10`,
    )
    .bind(minutesAgo(PHONE_WINDOW_MINUTES), phoneKey)
    .all<RecentOrderRow>()).results ?? [];
  const duplicateSince = minutesAgo(DUPLICATE_WINDOW_MINUTES);
  const duplicate = recent.find((row) => row.status === "pending_confirmation" && row.created_at >= duplicateSince &&
    Number(row.item_count) === itemCount && Math.abs(Number(row.subtotal_amount) - subtotal) < 0.005);
  if (duplicate) return { persisted: true, orderCode: duplicate.order_code };
  if (recent.length >= MAX_ORDERS_PER_PHONE) return { persisted: false, orderCode: null, throttled: true };

  const orderCode = buildOrderCode();

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
