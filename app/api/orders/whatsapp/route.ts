import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createWhatsAppOrderRecord } from "../../../../lib/orders/repository";
import { consumeRateLimit } from "../../../../lib/server/rateLimit";
import type {
  CheckoutSource,
  CreateWhatsAppOrderPayload,
  CreateWhatsAppOrderResponse,
  WhatsAppOrderCustomerInput,
  WhatsAppOrderItemInput,
} from "../../../../lib/orders/types";

function getClientIp(request: Request) {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

function asText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asPrice(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}

function asQuantity(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  const qty = Math.floor(num);
  return qty > 0 ? qty : null;
}

function parseSource(value: unknown): CheckoutSource | null {
  return value === "cart" || value === "product" ? value : null;
}

function parseCustomer(value: unknown): WhatsAppOrderCustomerInput | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;

  return {
    fullName: asText(data.fullName, 140),
    email: asText(data.email, 180),
    phone: asText(data.phone, 40),
    province: asText(data.province, 100),
    city: asText(data.city, 100),
    sector: asText(data.sector, 140),
    addressLine1: asText(data.addressLine1, 200),
    addressLine2: asText(data.addressLine2, 200),
    reference: asText(data.reference, 260),
    deliveryNotes: asText(data.deliveryNotes, 360),
  };
}

function parseItems(value: unknown): WhatsAppOrderItemInput[] | null {
  if (!Array.isArray(value)) return null;

  const items: WhatsAppOrderItemInput[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    const price = asPrice(item.price);
    const quantity = asQuantity(item.quantity);

    if (!price && price !== 0) return null;
    if (!quantity) return null;

    const parsed: WhatsAppOrderItemInput = {
      id: asText(item.id, 120),
      name: asText(item.name, 180),
      category: asText(item.category, 80),
      price,
      quantity,
      currency: asText(item.currency, 8) || "DOP",
      imageUrl: asText(item.imageUrl, 500),
    };

    if (!parsed.id || !parsed.name) return null;

    items.push(parsed);
  }

  return items;
}

function parsePayload(value: unknown): CreateWhatsAppOrderPayload | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;

  const source = parseSource(data.source);
  const customer = parseCustomer(data.customer);
  const items = parseItems(data.items);

  if (!source || !customer || !items || items.length === 0) return null;

  const missingRequired = [
    customer.fullName,
    customer.phone,
    customer.province,
    customer.city,
    customer.addressLine1,
  ].some((item) => !item);

  if (missingRequired) return null;

  return { source, customer, items };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`orders:whatsapp:${ip}`, {
    limit: 8,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      {
        ok: false,
        persisted: false,
        orderCode: null,
        error: "Demasiados intentos. Intenta de nuevo en un momento.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rate.remaining),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      { ok: false, persisted: false, orderCode: null, error: "JSON invalido" },
      { status: 400 },
    );
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      {
        ok: false,
        persisted: false,
        orderCode: null,
        error: "Datos de pedido incompletos",
      },
      { status: 400 },
    );
  }

  let clerkUserId: string | null = null;
  try {
    const session = await auth();
    clerkUserId = session.userId ?? null;
  } catch {
    clerkUserId = null;
  }

  try {
    const result = await createWhatsAppOrderRecord({
      source: payload.source,
      items: payload.items,
      customer: payload.customer,
      clerkUserId,
    });

    return NextResponse.json<CreateWhatsAppOrderResponse>({
      ok: true,
      persisted: result.persisted,
      orderCode: result.orderCode,
    }, {
      headers: {
        "X-RateLimit-Remaining": String(rate.remaining),
      },
    });
  } catch (error) {
    console.error("WhatsApp order persist failed", error);
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      {
        ok: false,
        persisted: false,
        orderCode: null,
        error: "No se pudo registrar el pedido",
      },
      { status: 500 },
    );
  }
}
