export type CheckoutSource = "cart" | "product";

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
