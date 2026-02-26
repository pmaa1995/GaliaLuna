export const SANITY_CACHE_TAGS = {
  products: "sanity:products",
  homeSettings: "sanity:home-settings",
  productSlugs: "sanity:product-slugs",
} as const;

export const SANITY_CACHE_TAG_LIST = Object.values(SANITY_CACHE_TAGS);

