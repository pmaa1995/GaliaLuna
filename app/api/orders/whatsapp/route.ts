import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getCheckoutProducts } from "../../../../lib/catalogData";
import { createWhatsAppOrderRecord } from "../../../../lib/orders/repository";
import {
  CheckoutValidationError, MAX_CHECKOUT_BODY_BYTES, parseCheckoutPayload, validateCheckoutCatalog,
} from "../../../../lib/orders/validation";
import { consumeOrderRateLimit } from "../../../../lib/server/rateLimit";
import type { CreateWhatsAppOrderResponse } from "../../../../lib/orders/types";

function getClientIp(request: Request) {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function fail(error: string, status: number) {
  return NextResponse.json<CreateWhatsAppOrderResponse>(
    { ok: false, persisted: false, orderCode: null, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function readLimitedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_CHECKOUT_BODY_BYTES) {
    throw new CheckoutValidationError("El pedido es demasiado grande.", 413);
  }
  if (!request.body) throw new CheckoutValidationError("JSON invalido");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_CHECKOUT_BODY_BYTES) {
        await reader.cancel();
        throw new CheckoutValidationError("El pedido es demasiado grande.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof CheckoutValidationError) throw error;
    throw new CheckoutValidationError("JSON invalido");
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const rate = await consumeOrderRateLimit(`orders:whatsapp:${getClientIp(request)}`, {
    limit: 8, windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      { ok: false, persisted: false, orderCode: null, error: "Demasiados intentos. Intenta de nuevo en un momento." },
      { status: 429, headers: {
        "Retry-After": String(rate.retryAfterSeconds),
        "Cache-Control": "no-store",
      } },
    );
  }

  let payload;
  try {
    payload = parseCheckoutPayload(await readLimitedJson(request));
  } catch (error) {
    if (error instanceof CheckoutValidationError) return fail(error.message, error.status);
    return fail("Datos de pedido invalidos", 400);
  }

  try {
    payload = validateCheckoutCatalog(payload, await getCheckoutProducts());
  } catch (error) {
    if (error instanceof CheckoutValidationError) return fail(error.message, error.status);
    console.error("Checkout catalog unavailable");
    return fail("No pudimos verificar disponibilidad. Intenta de nuevo en un momento.", 503);
  }

  let clerkUserId: string | null = null;
  try {
    clerkUserId = (await auth()).userId ?? null;
  } catch {
    clerkUserId = null;
  }

  try {
    const result = await createWhatsAppOrderRecord({ ...payload, clerkUserId });
    if (!result.persisted || !result.orderCode) {
      return fail("No se pudo registrar el pedido. Intenta de nuevo en un momento.", 503);
    }
    return NextResponse.json<CreateWhatsAppOrderResponse>(
      { ok: true, persisted: true, orderCode: result.orderCode },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("WhatsApp order persistence failed");
    return fail("No se pudo registrar el pedido. Intenta de nuevo.", 500);
  }
}
