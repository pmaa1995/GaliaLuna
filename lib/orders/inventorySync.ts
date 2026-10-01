import type { AdminOrderDetail } from "./types";
import { sanityWriteClient } from "../../sanity/lib/writeClient";

type SanityInventoryRow = { _id: string; _rev: string; inventory?: number | null };
export interface InventoryAdjustResult { ok: boolean; adjusted: boolean; error: string | null; }

function failed(error: string): InventoryAdjustResult { return { ok: false, adjusted: false, error }; }

export async function adjustSanityInventoryForConfirmedOrder(
  order: AdminOrderDetail,
): Promise<InventoryAdjustResult> {
  if (!sanityWriteClient) return failed("SANITY_WRITE_TOKEN no configurado");
  if (order.inventoryAdjustedAt) return { ok: true, adjusted: true, error: null };
  if (!order.orderCode || order.status !== "confirmed") return failed("El pedido debe estar confirmado");

  const qtyByProductId = new Map<string, number>();
  for (const item of order.items) {
    if (!item.productId || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      return failed("El pedido contiene cantidades o productos invalidos");
    }
    const quantity = (qtyByProductId.get(item.productId) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) return failed("Cantidad de inventario invalida");
    qtyByProductId.set(item.productId, quantity);
  }
  const productIds = Array.from(qtyByProductId.keys());
  if (productIds.length === 0) return failed("El pedido no contiene productos");

  // The marker contains no customer details or readable order code in a public dataset.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(order.orderCode));
  const markerId = "orderInventoryAdjustment." + Array.from(new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0")).join("");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await sanityWriteClient.fetch<{
      marker: { _id: string } | null;
      products: SanityInventoryRow[];
    }>(
      `{
        "marker": *[_id == $markerId][0]{ _id },
        "products": *[_type == "product" && _id in $ids]{ _id, _rev, inventory }
      }`,
      { ids: productIds, markerId },
      { cache: "no-store" },
    );
    // Also heals the case where Sanity committed but the D1 acknowledgement failed.
    if (snapshot.marker) return { ok: true, adjusted: true, error: null };
    const currentById = new Map(snapshot.products.map((row) => [row._id, row]));
    const transaction = sanityWriteClient.transaction().create({
      _id: markerId, _type: "orderInventoryAdjustment",
    });
    for (const [productId, quantity] of qtyByProductId) {
      const row = currentById.get(productId);
      if (!row || !row._rev) return failed("Un producto del pedido ya no existe en Sanity");
      if (typeof row.inventory !== "number" || !Number.isSafeInteger(row.inventory) ||
          row.inventory < quantity) {
        return failed("Inventario insuficiente. Revisa disponibilidad antes de reintentar.");
      }
      // A simultaneous purchase or editor update rejects the whole transaction instead of losing stock.
      transaction.patch(productId, (patch) => patch.ifRevisionId(row._rev).dec({ inventory: quantity }));
    }
    try {
      // create (not createIfNotExists) makes repeat or concurrent confirmations atomic no-ops.
      await transaction.commit({ visibility: "sync" });
      return { ok: true, adjusted: true, error: null };
    } catch (error) {
      const status = error && typeof error === "object" && "statusCode" in error ? error.statusCode : null;
      if (status !== 409) throw error;
      if (attempt === 2) return failed("El inventario cambio durante la confirmacion. Reintenta el ajuste.");
    }
  }
  return failed("No se pudo ajustar el inventario");
}
