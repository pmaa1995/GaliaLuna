import type { Product } from "../types/product";

export const SITE_URL = "https://www.galialuna.com";

export function productUrl(product: Product) {
  return SITE_URL + "/product/" + encodeURIComponent(product.slug.current);
}

// CMS text must never be able to terminate an inline JSON-LD script.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function productSchema(product: Product) {
  return {
    "@type": "Product",
    "@id": productUrl(product) + "#product",
    url: productUrl(product),
    name: product.name,
    description: product.description,
    category: product.category,
    sku: product._id,
    brand: { "@type": "Brand", name: "Galia Luna" },
    image: product.images.map((image) => new URL(image.url, SITE_URL).href),
    offers: {
      "@type": "Offer",
      url: productUrl(product),
      priceCurrency: product.currency,
      price: product.price,
      ...(typeof product.inventory === "number" ? {
        availability: product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      } : {}),
      seller: { "@type": "Organization", name: "Galia Luna" },
    },
  };
}
