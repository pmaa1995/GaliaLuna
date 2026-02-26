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

  const heroProducts = Array.isArray(input.heroProducts)
    ? dedupeProducts(
        input.heroProducts
          .map((value) => mapSanityProduct(value))
          .filter((product): product is Product => Boolean(product))
          .filter((product) => product.isActive),
      ).slice(0, 3)
    : [];

  const featuredProduct = mapSanityProduct(input.featuredProduct);

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
  if (!Array.isArray(raw)) return [];

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

export const getCatalogSource = cache(async (): Promise<CatalogSource> => {
  try {
    const sanityProducts = await fetchSanityProducts();

    if (sanityProducts.length > 0) {
      const activeProducts = filterActiveProducts(sanityProducts);
      const homeShowcase = await fetchSanityHomeShowcase(activeProducts);

      return {
        allProducts: sanityProducts,
        activeProducts,
        homeShowcase,
        source: "sanity",
      };
    }
  } catch (error) {
    console.warn("Sanity fetch failed, using local catalog fallback.", error);
  }

  const activeProducts = filterActiveProducts(catalogProducts);

  return {
    allProducts: catalogProducts,
    activeProducts,
    homeShowcase: getResolvedHomeShowcase(activeProducts, localHomeSettings),
    source: "local",
  };
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
  if (isSanityEnvironmentConfigured) {
    try {
      const rows = await sanityClient.fetch<Array<{ slug?: string }>>(
        activeProductSlugsQuery,
        {},
        {
          next: {
            revalidate: 60,
            tags: [SANITY_CACHE_TAGS.productSlugs],
          },
        },
      );

      const slugs = (rows ?? [])
        .map((row) => row.slug)
        .filter((slug): slug is string => Boolean(slug));

      if (slugs.length > 0) {
        return Array.from(new Set(slugs));
      }
    } catch (error) {
      console.warn("Sanity slug fetch failed, using local catalog fallback.", error);
    }
  }

  return filterActiveProducts(catalogProducts).map((product) => product.slug.current);
}
