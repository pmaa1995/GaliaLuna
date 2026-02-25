export const PRODUCT_CATEGORIES = [
  "Anillos",
  "Aretes",
  "Cadenas",
  "Carteras",
  "Collares",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type CategoryFilter = "all" | ProductCategory;

export const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "Ver todos" },
  { value: "Anillos", label: "Anillos" },
  { value: "Aretes", label: "Aretes" },
  { value: "Cadenas", label: "Cadenas" },
  { value: "Carteras", label: "Carteras" },
  { value: "Collares", label: "Collares" },
] as const satisfies ReadonlyArray<{ value: CategoryFilter; label: string }>;

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Product {
  _id: string;
  _type: "product";
  name: string;
  slug: {
    current: string;
  };
  category: ProductCategory;
  description: string;
  price: number;
  currency: "DOP";
  images: ProductImage[];
  isActive: boolean;
  badge?: string;
  inventory?: number | null;
}

export interface CartProductSnapshot {
  id: string;
  name: string;
  price: number;
  currency: "DOP";
  imageUrl: string;
  imageAlt: string;
  category: ProductCategory;
}

export const FALLBACK_PRODUCT_IMAGE: ProductImage = {
  url: "/images/product-placeholder.svg",
  alt: "Producto Galia Luna",
  width: 1200,
  height: 1200,
};

export const PRODUCT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTYnIGhlaWdodD0nMTYnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzE2JyBoZWlnaHQ9JzE2JyBmaWxsPScjRjVGM0VFJy8+PC9zdmc+";

export function toCartProductSnapshot(product: Product): CartProductSnapshot {
  const primaryImage = product.images[0] ?? FALLBACK_PRODUCT_IMAGE;

  return {
    id: product._id,
    name: product.name,
    price: product.price,
    currency: product.currency,
    imageUrl: primaryImage.url,
    imageAlt: primaryImage.alt,
    category: product.category,
  };
}

export function formatDOP(amount: number): string {
  return `RD$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}
