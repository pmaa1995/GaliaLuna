export type CheckoutSource = "cart" | "product";

export const ORDER_STATUS_VALUES = [
  "pending_confirmation",
  "confirmed",
  "in_preparation",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Pendiente de confirmacion",
  confirmed: "Confirmado",
  in_preparation: "En preparacion",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export interface WhatsAppOrderCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  sector: string;
  addressLine1: string;
  addressLine2: string;
  reference: string;
  deliveryNotes: string;
}

export interface WhatsAppOrderItemInput {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  currency?: string;
  imageUrl?: string;
}

export interface CreateWhatsAppOrderPayload {
  source: CheckoutSource;
  items: WhatsAppOrderItemInput[];
  customer: WhatsAppOrderCustomerInput;
}

export interface CreateWhatsAppOrderResponse {
  ok: boolean;
  persisted: boolean;
  orderCode: string | null;
  error?: string;
}

export interface AdminOrderSummary {
  id: number;
  orderCode: string;
  source: CheckoutSource;
  customerMode: "account" | "guest";
  clerkUserId: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  province: string;
  city: string;
  subtotalAmount: number;
  currency: string;
  itemCount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  inventoryAdjustedAt: string | null;
  inventoryAdjustmentError: string | null;
}

export interface AdminOrderItem {
  id: number;
  orderId: number;
  productId: string;
  productName: string;
  productCategory: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  currency: string;
  imageUrl: string | null;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  sector: string | null;
  addressLine1: string;
  addressLine2: string | null;
  referenceText: string | null;
  deliveryNotes: string | null;
  channel: string;
  items: AdminOrderItem[];
}

export interface CustomerOrderSummary {
  id: number;
  orderCode: string;
  itemCount: number;
  subtotalAmount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrdersPageResult {
  orders: CustomerOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
