import type { Product } from "../../types/product";
import type { CreateWhatsAppOrderPayload, WhatsAppOrderCustomerInput } from "./types";

export const MAX_ORDER_LINES = 50;
export const MAX_ITEM_QUANTITY = 99;
export const MAX_ORDER_QUANTITY = 200;
export const MAX_UNIT_PRICE = 1_000_000;
export const MAX_ORDER_TOTAL = 10_000_000;
export const MAX_CHECKOUT_BODY_BYTES = 64 * 1024;

export class CheckoutValidationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= 0 && value <= MAX_UNIT_PRICE &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

export function isValidProductId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,119}$/.test(value) &&
    !value.startsWith("drafts.") && !value.startsWith("versions.");
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

const customerLimits: Record<keyof WhatsAppOrderCustomerInput, number> = {
  fullName: 140, email: 180, phone: 40, province: 100, city: 100, sector: 140,
  addressLine1: 200, addressLine2: 200, reference: 260, deliveryNotes: 360,
};

export function parseCheckoutPayload(value: unknown): CreateWhatsAppOrderPayload {
  const data = object(value);
  const customerData = object(data?.customer);
  if (!data || !customerData || (data.source !== "cart" && data.source !== "product") ||
      !Array.isArray(data.items) || data.items.length < 1 || data.items.length > MAX_ORDER_LINES) {
    throw new CheckoutValidationError("Datos de pedido incompletos o demasiados productos.");
  }

  const customer = {} as WhatsAppOrderCustomerInput;
  for (const key of Object.keys(customerLimits) as Array<keyof WhatsAppOrderCustomerInput>) {
    const raw = customerData[key];
    if (raw !== undefined && typeof raw !== "string") {
      throw new CheckoutValidationError("Revisa los datos de entrega.");
    }
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text.length > customerLimits[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
      throw new CheckoutValidationError("Uno de los datos de entrega es demasiado largo o invalido.");
    }
    customer[key] = text;
  }
  if (![customer.fullName, customer.phone, customer.province, customer.city, customer.addressLine1].every(Boolean)) {
    throw new CheckoutValidationError("Completa nombre, telefono y direccion de entrega.");
  }
  if (!/^[+\d\s().-]+$/.test(customer.phone) ||
      !/^\d{7,15}$/.test(customer.phone.replace(/\D/g, "")) ||
      (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))) {
    throw new CheckoutValidationError("Revisa el telefono y el correo de contacto.");
  }

  const seen = new Set<string>();
  let quantityTotal = 0;
  let totalCents = 0;
  const items = data.items.map((value: unknown) => {
    const item = object(value);
    if (!item || !isValidProductId(item.id) || seen.has(item.id) ||
        !isValidPrice(item.price) || typeof item.quantity !== "number" ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY ||
        (item.currency !== undefined && item.currency !== "DOP")) {
      throw new CheckoutValidationError("El carrito contiene un producto, precio o cantidad invalida. Actualizalo e intenta de nuevo.");
    }
    seen.add(item.id);
    quantityTotal += item.quantity;
    totalCents += Math.round(item.price * 100) * item.quantity;
    // Product descriptions are replaced by the current server catalog before saving.
    return { id: item.id, quantity: item.quantity, price: item.price, name: "", category: "", currency: "DOP" };
  });
  if (quantityTotal > MAX_ORDER_QUANTITY || totalCents > MAX_ORDER_TOTAL * 100) {
    throw new CheckoutValidationError("El pedido supera el limite permitido. Contactanos para pedidos grandes.");
  }
  return { source: data.source, customer, items };
}

export function validateCheckoutCatalog(
  payload: CreateWhatsAppOrderPayload,
  products: Product[],
): CreateWhatsAppOrderPayload {
  const byId = new Map(products.map((product) => [product._id, product]));
  const items = payload.items.map((item) => {
    const product = byId.get(item.id);
    if (!product || !product.isActive || !isValidPrice(product.price) || product.currency !== "DOP") {
      throw new CheckoutValidationError("Una pieza ya no esta disponible. Actualiza el carrito.", 409);
    }
    if (product.price !== item.price) {
      throw new CheckoutValidationError("El precio de una pieza ha cambiado. Actualiza la pagina y vuelve a agregarla al carrito.", 409);
    }
    if (product.inventory != null && (typeof product.inventory !== "number" ||
        !Number.isSafeInteger(product.inventory) || product.inventory < item.quantity)) {
      throw new CheckoutValidationError("No hay inventario suficiente para una pieza. Ajusta el carrito o consulta disponibilidad por WhatsApp.", 409);
    }
    return {
      id: product._id, name: product.name, category: product.category, price: product.price,
      quantity: item.quantity, currency: product.currency, imageUrl: product.images[0]?.url || "",
    };
  });
  return { ...payload, items };
}
