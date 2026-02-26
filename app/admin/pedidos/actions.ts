"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "../../../lib/admin/auth";
import {
  getOrderDetailById,
  markOrderInventoryAdjustment,
  updateOrderStatusById,
} from "../../../lib/orders/adminRepository";
import { adjustSanityInventoryForConfirmedOrder } from "../../../lib/orders/inventorySync";
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

  await applyInventoryAdjustmentIfNeeded(orderId);
  revalidatePath("/admin/pedidos");
  redirect(returnTo);
}

