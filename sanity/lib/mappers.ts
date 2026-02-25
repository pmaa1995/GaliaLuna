import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
  type ProductImage,
} from "../../types/product";

function normalizeCategory(input: unknown): ProductCategory {
  if (typeof input !== "string") return PRODUCT_CATEGORIES[0];
  const match = PRODUCT_CATEGORIES.find(
    (category) => category.toLowerCase() === input.toLowerCase(),
  );
  return match ?? PRODUCT_CATEGORIES[0];
}

function normalizeImages(input: unknown, fallbackAlt: string): ProductImage[] {
  if (!Array.isArray(input)) {
    return [FALLBACK_PRODUCT_IMAGE];
  }

  const images = input
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const candidate = value as Record<string, unknown>;
      const url = typeof candidate.url === "string" ? candidate.url : "";

      if (!url) return null;

      return {
        url,
        alt:
          typeof candidate.alt === "string" && candidate.alt.trim()
            ? candidate.alt
            : fallbackAlt,
        width:
          typeof candidate.width === "number" && Number.isFinite(candidate.width)
            ? candidate.width
            : 1200,
        height:
          typeof candidate.height === "number" && Number.isFinite(candidate.height)
            ? candidate.height
            : 1200,
      } satisfies ProductImage;
    })
    .filter((image): image is ProductImage => Boolean(image));

  return images.length > 0 ? images : [FALLBACK_PRODUCT_IMAGE];
}

export function mapSanityProduct(value: unknown): Product | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = typeof raw._id === "string" ? raw._id : "";
  const name = typeof raw.name === "string" ? raw.name : "";
  const slugObject =
    raw.slug && typeof raw.slug === "object"
      ? (raw.slug as { current?: unknown })
      : undefined;
  const slugCurrent =
    typeof slugObject?.current === "string" ? slugObject.current : "";

  if (!id || !name || !slugCurrent) {
    return null;
  }

  const price =
    typeof raw.price === "number" && Number.isFinite(raw.price) ? raw.price : 0;
  const currency = raw.currency === "DOP" ? "DOP" : "DOP";
  const category = normalizeCategory(raw.category);
  const description =
    typeof raw.description === "string" && raw.description.trim()
      ? raw.description
      : "Pieza disponible en Galia Luna.";

  const altFallback = `${name} de Galia Luna`;
  const images = normalizeImages(raw.images, altFallback);

  return {
    _id: id,
    _type: "product",
    name,
    slug: { current: slugCurrent },
    category,
    description,
    price,
    currency,
    images,
    isActive:
      typeof raw.isActive === "boolean" ? raw.isActive : true,
    badge: typeof raw.badge === "string" ? raw.badge : undefined,
    inventory:
      typeof raw.inventory === "number" && Number.isFinite(raw.inventory)
        ? raw.inventory
        : null,
  };
}

