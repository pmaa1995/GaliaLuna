import Link from "next/link";
import { getHomePageData } from "../../lib/catalogData";
import { parseStoreFilters, searchParamsToURL, type collectionCategories } from "../../lib/storefront";
import StoreShell from "./StoreShell";
import CatalogBrowser from "./CatalogBrowser";

type Category = (typeof collectionCategories)[number];

export default async function CollectionPage({ category, searchParams }: { category?: Category; searchParams: Record<string, string | string[] | undefined> }) {
  const { activeProducts } = await getHomePageData();
  const initialFilters = parseStoreFilters(searchParamsToURL(searchParams));
  const basePath = category ? `/coleccion/${category.slug}` : "/coleccion";
  return <StoreShell>
    <div className="shop-collection-heading shop-container"><nav aria-label="Ruta de navegación" className="shop-breadcrumb"><Link href="/">Inicio</Link><span aria-hidden="true">/</span>{category ? <><Link href="/coleccion">Colección</Link><span aria-hidden="true">/</span><span aria-current="page">{category.label}</span></> : <span aria-current="page">Colección</span>}</nav><div><p className="shop-eyebrow">JOYERÍA & ACCESORIOS</p><h1>{category?.label ?? "Todas las piezas."}</h1><p>{category?.description ?? "Explora, combina y encuentra los detalles que hablan de ti."}</p></div></div>
    <CatalogBrowser products={activeProducts} initialFilters={initialFilters} category={category?.label} basePath={basePath} />
  </StoreShell>;
}
