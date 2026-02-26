import type { OrderStatus } from "./types";

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "shipped",
  "delivered",
  "cancelled",
];

const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["in_preparation", "cancelled"],
  in_preparation: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function getAllowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return NEXT_STATUS_MAP[current] ?? [];
}

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === next) return true;
  return getAllowedNextStatuses(current).includes(next);
}

