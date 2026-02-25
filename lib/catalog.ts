import type { Product } from "../types/product";

export interface HomeSettings {
  heroProductSlugs: string[];
  featuredProductSlug?: string;
}

export interface ResolvedHomeShowcase {
  heroProducts: Product[];
  featuredProduct?: Product;
}

export const catalogProducts: Product[] = [
  {
    _id: "prod-anillo-luna-sol",
    _type: "product",
    name: "Anillo Luna y Sol",
    slug: { current: "anillo-luna-y-sol" },
    category: "Anillos",
    description: "Anillo de acabado pulido con detalle inspirado en la luna y el sol. Ligero y fácil de combinar.",
    price: 400,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Anillo Luna y Sol de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    badge: "Best Seller",
    inventory: 12,
  },
  {
    _id: "prod-aretes-lagrimas",
    _type: "product",
    name: "Aretes de Lágrimas",
    slug: { current: "aretes-de-lagrimas" },
    category: "Aretes",
    description: "Aretes de caída suave con brillo sutil, ideales para elevar un look de día o de noche.",
    price: 700,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Aretes de Lágrimas de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    inventory: 8,
  },
  {
    _id: "prod-cadena-brisa",
    _type: "product",
    name: "Cadena Brisa",
    slug: { current: "cadena-brisa" },
    category: "Cadenas",
    description: "Cadena ligera de eslabones finos para uso diario, perfecta sola o en capas.",
    price: 950,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Cadena Brisa de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    badge: "Nuevo",
    inventory: 10,
  },
  {
    _id: "prod-cartera-nacar",
    _type: "product",
    name: "Cartera Nácar",
    slug: { current: "cartera-nacar" },
    category: "Carteras",
    description: "Cartera de mano de líneas limpias con herrajes metálicos y acabado elegante.",
    price: 1800,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Cartera Nácar de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    inventory: 5,
  },
  {
    _id: "prod-collar-orbita",
    _type: "product",
    name: "Collar Órbita",
    slug: { current: "collar-orbita" },
    category: "Collares",
    description: "Collar con colgante circular y presencia delicada para uso diario o regalo.",
    price: 1200,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Collar Órbita de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    inventory: 7,
  },
  {
    _id: "prod-anillo-aurora",
    _type: "product",
    name: "Anillo Aurora",
    slug: { current: "anillo-aurora" },
    category: "Anillos",
    description: "Anillo fino de silueta limpia, pensado para combinar con otras piezas.",
    price: 550,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Anillo Aurora de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    inventory: 15,
  },
  {
    _id: "prod-aretes-perla-noche",
    _type: "product",
    name: "Aretes Perla Noche",
    slug: { current: "aretes-perla-noche" },
    category: "Aretes",
    description: "Aretes de estilo clásico con brillo discreto y acabado sobrio.",
    price: 880,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Aretes Perla Noche de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    inventory: 9,
  },
  {
    _id: "prod-collar-luna-minimal",
    _type: "product",
    name: "Collar Luna Minimal",
    slug: { current: "collar-luna-minimal" },
    category: "Collares",
    description: "Collar minimalista con motivo de media luna y terminación refinada.",
    price: 990,
    currency: "DOP",
    images: [
      {
        url: "/images/product-placeholder.svg",
        alt: "Collar Luna Minimal de Galia Luna",
        width: 1200,
        height: 1200,
      },
    ],
    isActive: true,
    badge: "Edición limitada",
    inventory: 4,
  },
];

// "Sanity-ready" local config: later this object can come from a CMS document.
export const homeSettings: HomeSettings = {
  heroProductSlugs: [
    "anillo-luna-y-sol",
    "aretes-de-lagrimas",
    "cadena-brisa",
  ],
  featuredProductSlug: "anillo-luna-y-sol",
};

export function getActiveProducts(): Product[] {
  return filterActiveProducts(catalogProducts);
}

export function getProductBySlug(slug: string): Product | undefined {
  return findProductBySlug(catalogProducts, slug);
}

export function getRelatedProducts(
  product: Product,
  limit = 4,
): Product[] {
  return getRelatedProductsFromList(catalogProducts, product, limit);
}

export function filterActiveProducts(products: Product[]): Product[] {
  return products.filter((product) => product.isActive);
}

export function findProductBySlug(
  products: Product[],
  slug: string,
): Product | undefined {
  return products.find((product) => product.slug.current === slug);
}

export function getRelatedProductsFromList(
  products: Product[],
  product: Product,
  limit = 4,
): Product[] {
  const activeProducts = filterActiveProducts(products);

  const sameCategory = activeProducts.filter(
    (candidate) =>
      candidate._id !== product._id && candidate.category === product.category,
  );

  const fallback = activeProducts.filter(
    (candidate) =>
      candidate._id !== product._id && candidate.category !== product.category,
  );

  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getResolvedHomeShowcase(
  products: Product[],
  settings: HomeSettings = homeSettings,
): ResolvedHomeShowcase {
  const activeProducts = products.filter((product) => product.isActive);

  const bySlug = new Map(
    activeProducts.map((product) => [product.slug.current, product] as const),
  );

  const heroConfigured = settings.heroProductSlugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is Product => Boolean(product));

  const heroProducts: Product[] = [];
  const seenIds = new Set<string>();

  for (const product of heroConfigured) {
    if (heroProducts.length === 3) break;
    if (seenIds.has(product._id)) continue;
    heroProducts.push(product);
    seenIds.add(product._id);
  }

  for (const product of activeProducts) {
    if (heroProducts.length === 3) break;
    if (seenIds.has(product._id)) continue;
    heroProducts.push(product);
    seenIds.add(product._id);
  }

  const featuredProduct =
    (settings.featuredProductSlug
      ? bySlug.get(settings.featuredProductSlug)
      : undefined) ??
    activeProducts.find((product) => product.badge) ??
    activeProducts[0];

  return {
    heroProducts,
    featuredProduct,
  };
}
