import type { Product, ProductCategory } from "../types/product";

export const collectionCategories = [
  { slug: "anillos", label: "Anillos", description: "Pequeños detalles, mucha personalidad. Encuentra tu próximo anillo." },
  { slug: "aretes", label: "Aretes", description: "Un acento que transforma el conjunto. Explora nuestros aretes." },
  { slug: "cadenas", label: "Cadenas", description: "Para llevar solas o combinar a tu manera. Descubre nuestras cadenas." },
  { slug: "collares", label: "Collares", description: "Piezas que acompañan tu estilo y se llevan todas las miradas." },
  { slug: "carteras", label: "Carteras", description: "El complemento para llevar tu estilo contigo." },
] as const;

export function categoryFromSlug(slug: string) {
  return collectionCategories.find((category) => category.slug === slug);
}

export function categoryHref(category: ProductCategory) {
  return `/coleccion/${collectionCategories.find((item) => item.label === category)?.slug ?? ""}`;
}

// Give a small homepage selection the breadth of the catalog, without repeating the hero.
export function selectHomeProducts(products: Product[], heroId?: string) {
  const candidates = products.filter((product) => product.isActive && product._id !== heroId);
  const selection: Product[] = [];
  const seen = new Set<string>();
  const add = (product: Product | undefined) => {
    if (!product || seen.has(product._id) || selection.length >= 4) return;
    selection.push(product);
    seen.add(product._id);
  };
  for (const category of collectionCategories) add(candidates.find((product) => product.category === category.label));
  for (const product of candidates) add(product);
  if (!selection.length) add(products.find((product) => product.isActive));
  return selection;
}

export interface StoreFilters {
  q: string;
  sort: "selection" | "price-asc" | "price-desc";
  maxPrice: string;
  inStock: boolean;
  page: number;
}

export const COLLECTION_PAGE_SIZE = 24;
export const defaultFilters: StoreFilters = { q: "", sort: "selection", maxPrice: "", inStock: false, page: 1 };

export function parseStoreFilters(params: URLSearchParams): StoreFilters {
  const order = params.get("orden");
  const rawPrice = params.get("hasta")?.trim() ?? "";
  const price = Number(rawPrice);
  const page = Number(params.get("pagina") ?? 1);
  return {
    q: (params.get("q") ?? "").trim().slice(0, 120),
    sort: order === "price-asc" || order === "price-desc" ? order : "selection",
    maxPrice: rawPrice && Number.isFinite(price) && price >= 0 && price <= 1_000_000_000 ? String(price) : "",
    inStock: params.get("stock") === "1",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

export function filtersQuery(filters: StoreFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "selection") params.set("orden", filters.sort);
  if (filters.maxPrice !== "") params.set("hasta", filters.maxPrice);
  if (filters.inStock) params.set("stock", "1");
  if (filters.page > 1) params.set("pagina", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function searchParamsToURL(params: Record<string, string | string[] | undefined>) {
  const result = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (typeof value === "string") result.set(name, value);
    else if (Array.isArray(value) && value.length) result.set(name, value[0]);
  }
  return result;
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function selectProducts(products: Product[], filters: StoreFilters) {
  const terms = normalize(filters.q).split(/\s+/).filter(Boolean);
  const selected = products.filter((product) => {
    if (!product.isActive) return false;
    if (filters.inStock && !(typeof product.inventory === "number" && Number.isSafeInteger(product.inventory) && product.inventory > 0)) return false;
    if (filters.maxPrice !== "" && product.price > Number(filters.maxPrice)) return false;
    const text = normalize(`${product.name} ${product.category} ${product.description}`);
    return terms.every((term) => text.includes(term));
  });
  if (filters.sort === "price-asc") selected.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") selected.sort((a, b) => b.price - a.price);
  return selected;
}
