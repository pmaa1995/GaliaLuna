"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "../../../lib/admin/auth";
import {
  deleteOrders,
  getOrderDetailById,
  markOrderInventoryAdjustment,
  updateOrderStatusById,
} from "../../../lib/orders/adminRepository";
import { adjustSanityInventoryForConfirmedOrder, restoreSanityInventoryForOrder } from "../../../lib/orders/inventorySync";
import { canTransitionOrderStatus } from "../../../lib/orders/status";
import { ORDER_STATUS_VALUES, type OrderStatus } from "../../../lib/orders/types";

function parseOrderId(value: FormDataEntryValue | null) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
}

function parseOrderStatus(value: FormDataEntryValue | null): OrderStatus | null {
  if (typeof value !== "string") return null;
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : null;
}

function safeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin/pedidos";
  return value.startsWith("/admin/pedidos") ? value : "/admin/pedidos";
}

// Gives stock back for an order whose pieces were taken. On success the order no longer carries
// inventory_adjusted_at; on failure it keeps it plus the error, so the panel offers a retry.
async function restoreInventoryIfNeeded(orderId: number) {
  const order = await getOrderDetailById(orderId);
  if (!order?.inventoryAdjustedAt) return true;
  try {
    const result = await restoreSanityInventoryForOrder(order);
    await markOrderInventoryAdjustment({
      orderId,
      adjustedAt: result.ok ? null : order.inventoryAdjustedAt,
      error: result.ok ? null : result.error,
    });
    return result.ok;
  } catch (error) {
    await markOrderInventoryAdjustment({
      orderId,
      adjustedAt: order.inventoryAdjustedAt,
      error: error instanceof Error ? error.message : "Error al devolver inventario",
    });
    return false;
  }
}

async function applyInventoryAdjustmentIfNeeded(orderId: number) {
  const order = await getOrderDetailById(orderId);
  if (!order) return;
  if (order.status !== "confirmed") return;
  if (order.inventoryAdjustedAt) return;

  try {
    const result = await adjustSanityInventoryForConfirmedOrder(order);
    if (result.adjusted) {
      await markOrderInventoryAdjustment({
        orderId,
        adjustedAt: new Date().toISOString(),
        error: null,
      });
      return;
    }

    if (result.error) {
      await markOrderInventoryAdjustment({
        orderId,
        adjustedAt: null,
        error: result.error,
      });
    }
  } catch (error) {
    await markOrderInventoryAdjustment({
      orderId,
      adjustedAt: null,
      error: error instanceof Error ? error.message : "Error al ajustar inventario",
    });
  }
}

export async function updateAdminOrderStatusAction(formData: FormData) {
  await requireAdminUser();

  const orderId = parseOrderId(formData.get("orderId"));
  const nextStatus = parseOrderStatus(formData.get("nextStatus"));
  const returnTo = safeReturnTo(formData.get("returnTo"));

  if (!orderId || !nextStatus) {
    redirect(returnTo);
  }

  const currentOrder = await getOrderDetailById(orderId);
  if (!currentOrder) {
    redirect(returnTo);
  }

  if (!canTransitionOrderStatus(currentOrder.status, nextStatus)) {
    redirect(returnTo);
  }

  await updateOrderStatusById({ orderId, nextStatus });

  if (nextStatus === "confirmed") {
    await applyInventoryAdjustmentIfNeeded(orderId);
  }
  if (nextStatus === "cancelled") {
    await restoreInventoryIfNeeded(orderId);
  }

  revalidatePath("/admin/pedidos");
  redirect(returnTo);
}

export async function retryInventoryAdjustmentAction(formData: FormData) {
  await requireAdminUser();

  const orderId = parseOrderId(formData.get("orderId"));
  const returnTo = safeReturnTo(formData.get("returnTo"));

  if (!orderId) {
    redirect(returnTo);
  }

  const order = await getOrderDetailById(orderId);
  if (order?.status === "cancelled") await restoreInventoryIfNeeded(orderId);
  else await applyInventoryAdjustmentIfNeeded(orderId);
  revalidatePath("/admin/pedidos");
  redirect(returnTo);
}

export async function deleteOrdersAction(formData: FormData) {
  await requireAdminUser();

  const orderIds = formData.getAll("orderIds").map(parseOrderId).filter((id): id is number => id !== null);
  const returnTo = safeReturnTo(formData.get("returnTo"));
  // The panel asks for an explicit confirmation field before anything is removed.
  if (orderIds.length && formData.get("confirmDelete") === "1") {
    let deletable = orderIds;
    // Optional: put the pieces of these orders back in stock first (useful for test orders).
    // Orders whose stock could not be restored are kept, with the error, for a retry.
    if (formData.get("restoreInventory") === "1") {
      const restored = await Promise.all(orderIds.map((id) => restoreInventoryIfNeeded(id)));
      deletable = orderIds.filter((_, index) => restored[index]);
    }
    await deleteOrders(deletable);
    revalidatePath("/admin/pedidos");
    revalidatePath("/mi-cuenta");
  }
  redirect(returnTo);
}
