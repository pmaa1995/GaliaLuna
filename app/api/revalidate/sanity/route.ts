import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { SANITY_CACHE_TAG_LIST } from "../../../../lib/cacheTags";

type WebhookPayload = {
  slug?: string | { current?: string } | null;
  document?: {
    slug?: string | { current?: string } | null;
  } | null;
  ids?: unknown;
  _id?: string;
};

function readSecret(request: Request) {
  const url = new URL(request.url);
  return (
    request.headers.get("x-sanity-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret") ||
    ""
  );
}

function extractSlugs(payload: WebhookPayload | null): string[] {
  if (!payload) return [];

  const values = [
    typeof payload.slug === "string" ? payload.slug : payload.slug?.current,
    typeof payload.document?.slug === "string"
      ? payload.document.slug
      : payload.document?.slug?.current,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return Array.from(new Set(values.map((value) => value.trim())));
}

export async function POST(request: Request) {
  const configuredSecret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  const receivedSecret = readSecret(request).trim();

  if (!configuredSecret) {
    return NextResponse.json(
      { ok: false, error: "SANITY_WEBHOOK_SECRET no configurado" },
      { status: 503 },
    );
  }

  if (!receivedSecret || receivedSecret !== configuredSecret) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let payload: WebhookPayload | null = null;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    payload = null;
  }

  for (const tag of SANITY_CACHE_TAG_LIST) {
    revalidateTag(tag);
  }

  revalidatePath("/");

  const slugs = extractSlugs(payload);
  for (const slug of slugs) {
    revalidatePath(`/product/${slug}`);
  }

  return NextResponse.json({
    ok: true,
    revalidatedTags: SANITY_CACHE_TAG_LIST,
    revalidatedPaths: ["/", ...slugs.map((slug) => `/product/${slug}`)],
  });
}

