import type { AdminOrderDetail } from "./types";
import { sanityWriteClient } from "../../sanity/lib/writeClient";

type SanityInventoryRow = {
  _id: string;
  inventory?: number | null;
};

export interface InventoryAdjustResult {
  ok: boolean;
  adjusted: boolean;
  error: string | null;
}

export async function adjustSanityInventoryForConfirmedOrder(
  order: AdminOrderDetail,
): Promise<InventoryAdjustResult> {
  if (!sanityWriteClient) {
    return {
      ok: false,
      adjusted: false,
      error: "SANITY_WRITE_TOKEN no configurado",
    };
  }

  const qtyByProductId = new Map<string, number>();
  for (const item of order.items) {
    if (!item.productId) continue;
    qtyByProductId.set(
      item.productId,
      (qtyByProductId.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const productIds = Array.from(qtyByProductId.keys());
  if (productIds.length === 0) {
    return { ok: true, adjusted: false, error: null };
  }

  const rows = await sanityWriteClient.fetch<SanityInventoryRow[]>(
    `*[_type == "product" && _id in $ids]{ _id, inventory }`,
    { ids: productIds },
    { cache: "no-store" },
  );

  const currentById = new Map(
    (rows ?? []).map((row) => [row._id, typeof row.inventory === "number" ? row.inventory : 0]),
  );

  const missing = productIds.filter((id) => !currentById.has(id));
  if (missing.length > 0) {
    return {
      ok: false,
      adjusted: false,
      error: `Productos no encontrados en Sanity: ${missing.join(", ")}`,
    };
  }

  for (const [productId, qty] of qtyByProductId.entries()) {
    const currentInventory = currentById.get(productId) ?? 0;
    const nextInventory = Math.max(0, currentInventory - qty);

    await sanityWriteClient.patch(productId).set({ inventory: nextInventory }).commit();
  }

  return { ok: true, adjusted: true, error: null };
}

