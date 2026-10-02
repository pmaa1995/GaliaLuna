// Proof of the last order, kept on the shopper's device so the home page can show it after the
// checkout hands over to WhatsApp (phones may reload the tab when returning from the app).
export interface OrderReceipt {
  orderCode: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  whatsappUrl: string;
  // False when the browser blocked the WhatsApp tab; the receipt then asks to open it.
  whatsappOpened: boolean;
  signedIn: boolean;
}

const RECEIPT_STORAGE_KEY = "galia-luna-last-order-v1";

export const ORDER_RECEIPT_PARAM = "pedido";

export function isOrderCode(value: string | null | undefined): value is string {
  return typeof value === "string" && /^GL-[A-Za-z0-9-]{3,80}$/.test(value);
}

export function saveOrderReceipt(receipt: OrderReceipt) {
  try {
    window.localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
  } catch {
    // The page still shows the order code from the URL.
  }
}

export function readOrderReceipt(orderCode: string): OrderReceipt | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECEIPT_STORAGE_KEY) ?? "null") as OrderReceipt | null;
    return parsed && parsed.orderCode === orderCode && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}
