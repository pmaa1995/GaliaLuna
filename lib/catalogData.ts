import { cache } from "react";

import type { Product } from "../types/product";
import {
  catalogProducts,
  filterActiveProducts,
  getResolvedHomeShowcase,
  getRelatedProductsFromList,
  homeSettings as localHomeSettings,
} from "./catalog";
import type { ResolvedHomeShowcase } from "./catalog";
import { isSanityEnvironmentConfigured } from "../sanity/env";
import { sanityClient } from "../sanity/lib/client";
import {
  allProductsQuery,
  activeProductSlugsQuery,
  homeSettingsQuery,
} from "../sanity/lib/queries";
import { mapSanityProduct } from "../sanity/lib/mappers";
import { SANITY_CACHE_TAGS } from "./cacheTags";

interface SanityHomeSettingsResponse {
  heroProducts?: unknown[];
  featuredProduct?: unknown;
}

interface CatalogSource {
  allProducts: Product[];
  activeProducts: Product[];
  homeShowcase: ResolvedHomeShowcase;
  source: "sanity" | "local";
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];

  for (const product of products) {
    if (seen.has(product._id)) continue;
    seen.add(product._id);
    result.push(product);
  }

  return result;
}

function mapSanityHomeShowcase(
  input: SanityHomeSettingsResponse | null | undefined,
  activeProducts: Product[],
): ResolvedHomeShowcase {
  if (!input) {
    return getResolvedHomeShowcase(activeProducts, localHomeSettings);
  }

  const activeById = new Map(activeProducts.map((product) => [product._id, product]));
  const heroProducts = Array.isArray(input.heroProducts)
    ? dedupeProducts(
        input.heroProducts
          .map((value) => mapSanityProduct(value))
          .map((product) => product ? activeById.get(product._id) : undefined)
          .filter((product): product is Product => Boolean(product))
          .filter((product) => product.isActive),
      ).slice(0, 3)
    : [];

  const featuredReference = mapSanityProduct(input.featuredProduct);
  const featuredProduct = featuredReference ? activeById.get(featuredReference._id) : undefined;

  if (heroProducts.length === 0 && !featuredProduct) {
    return getResolvedHomeShowcase(activeProducts, localHomeSettings);
  }

  return {
    heroProducts:
      heroProducts.length > 0
        ? heroProducts
        : getResolvedHomeShowcase(activeProducts, localHomeSettings).heroProducts,
    featuredProduct:
      featuredProduct && featuredProduct.isActive
        ? featuredProduct
        : getResolvedHomeShowcase(activeProducts, localHomeSettings).featuredProduct,
  };
}

async function fetchSanityProducts(): Promise<Product[]> {
  if (!isSanityEnvironmentConfigured) return [];

  const raw = await sanityClient.fetch<unknown[]>(
    allProductsQuery,
    {},
    {
      next: {
        revalidate: 60,
        tags: [SANITY_CACHE_TAGS.products],
      },
    },
  );
  if (!Array.isArray(raw)) throw new Error("Invalid catalog response");

  const products = raw
    .map((item) => mapSanityProduct(item))
    .filter((product): product is Product => Boolean(product));

  return dedupeProducts(products);
}

async function fetchSanityHomeShowcase(
  activeProducts: Product[],
): Promise<ResolvedHomeShowcase> {
  if (!isSanityEnvironmentConfigured) {
    return getResolvedHomeShowcase(activeProducts, localHomeSettings);
  }

  const raw = await sanityClient.fetch<SanityHomeSettingsResponse | null>(
    homeSettingsQuery,
    {},
    {
      next: {
        revalidate: 60,
        tags: [SANITY_CACHE_TAGS.homeSettings],
      },
    },
  );

  return mapSanityHomeShowcase(raw, activeProducts);
}

// Checkout must read the origin, bypassing both the Sanity CDN and Next cache.
export async function getCheckoutProducts(): Promise<Product[]> {
  if (!isSanityEnvironmentConfigured) throw new Error("Catalog is not configured");
  const raw = await sanityClient.withConfig({ useCdn: false }).fetch<unknown[]>(allProductsQuery, {}, { cache: "no-store" });
  if (!Array.isArray(raw)) throw new Error("Invalid catalog response");
  return dedupeProducts(raw.map(mapSanityProduct).filter((product): product is Product => Boolean(product)));
}

export const getCatalogSource = cache(async (): Promise<CatalogSource> => {
  if (!isSanityEnvironmentConfigured) {
    const activeProducts = filterActiveProducts(catalogProducts);
    return { allProducts: catalogProducts, activeProducts, homeShowcase: getResolvedHomeShowcase(activeProducts, localHomeSettings), source: "local" };
  }

  // An empty published catalog is valid. A CMS outage must never sell demo items.
  const sanityProducts = await fetchSanityProducts();
  const activeProducts = filterActiveProducts(sanityProducts);
  let homeShowcase = getResolvedHomeShowcase(activeProducts, localHomeSettings);
  try {
    homeShowcase = await fetchSanityHomeShowcase(activeProducts);
  } catch {
    console.warn("Home curation unavailable; using the published catalog.");
  }
  return { allProducts: sanityProducts, activeProducts, homeShowcase, source: "sanity" };
});

export async function getHomePageData() {
  return getCatalogSource();
}

export async function getProductPageData(slug: string) {
  const source = await getCatalogSource();
  const product = source.allProducts.find((item) => item.slug.current === slug);

  if (!product || !product.isActive) {
    return null;
  }

  return {
    product,
    relatedProducts: getRelatedProductsFromList(source.allProducts, product, 4),
    source: source.source,
  };
}

export async function getActiveProductSlugs(): Promise<string[]> {
  if (!isSanityEnvironmentConfigured) {
    return filterActiveProducts(catalogProducts).map((product) => product.slug.current);
  }
  const rows = await sanityClient.fetch<Array<{ slug?: string }>>(activeProductSlugsQuery, {}, {
    next: { revalidate: 60, tags: [SANITY_CACHE_TAGS.productSlugs] },
  });
  if (!Array.isArray(rows)) throw new Error("Invalid catalog response");
  return Array.from(new Set(rows.map((row) => row.slug).filter((slug): slug is string => typeof slug === "string" && slug.length > 0)));
}
