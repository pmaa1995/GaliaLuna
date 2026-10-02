"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_PAGE_SIZE, defaultFilters, filtersQuery, parseStoreFilters, selectProducts, type StoreFilters } from "../../lib/storefront";
import type { Product, ProductCategory } from "../../types/product";
import ProductCard from "./ProductCard";

interface CatalogBrowserProps { products: Product[]; initialFilters: StoreFilters; category?: ProductCategory; basePath: string; }

export default function CatalogBrowser({ products, initialFilters, category, basePath }: CatalogBrowserProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const restoredScroll = useRef(false);
  useEffect(() => { setFilters(parseStoreFilters(new URLSearchParams(window.location.search))); }, [initialFilters]);
  useEffect(() => {
    const restore = () => setFilters(parseStoreFilters(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (restoredScroll.current) return;
    const saved = window.history.state?.galiaCatalog;
    const currentURL = window.location.pathname + window.location.search;
    if (!saved || saved.url !== currentURL || !Number.isFinite(saved.scrollY)) return;
    if (filtersQuery(filters) !== filtersQuery(parseStoreFilters(new URLSearchParams(window.location.search)))) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: saved.scrollY, behavior: "instant" });
      restoredScroll.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [filters]);
  const scopedProducts = useMemo(() => category ? products.filter((product) => product.category === category) : products, [products, category]);
  const results = useMemo(() => selectProducts(scopedProducts, filters), [scopedProducts, filters]);
  const pageCount = Math.max(1, Math.ceil(results.length / COLLECTION_PAGE_SIZE));
  const visiblePage = Math.min(filters.page, pageCount);
  const visible = results.slice(0, visiblePage * COLLECTION_PAGE_SIZE);
  const activeFilters = Boolean(filters.q || filters.maxPrice !== "" || filters.inStock || filters.sort !== "selection");
  const update = (patch: Partial<StoreFilters>, mode: "push" | "replace" = "push") => {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    if (next.maxPrice !== "" && (!Number.isFinite(Number(next.maxPrice)) || Number(next.maxPrice) < 0 || Number(next.maxPrice) > 1_000_000_000)) next.maxPrice = "";
    setFilters(next);
    const url = basePath + filtersQuery(next);
    if (url !== window.location.pathname + window.location.search) {
      window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
    }
  };
  const reset = () => update({ ...defaultFilters });
  return <div className="shop-catalog shop-container" id="catalogo">
    <noscript><style>{`.shop .shop-filter-panel[hidden] {display:flex !important}.shop .shop-filter-toggle {display:none !important}`}</style></noscript>
    <form action={basePath} className="shop-catalog-form" onSubmit={(event) => { event.preventDefault(); update({ q: filters.q.trim() }, "replace"); }}>
      <div className="shop-catalog-toolbar">
        <div className="shop-catalog-search"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Buscar piezas</label><input id="catalog-search" name="q" type="search" placeholder="Buscar en la colección" value={filters.q} maxLength={120} onChange={(event) => update({ q: event.target.value }, "replace")} /><button type="submit" className="shop-icon-button" aria-label="Aplicar búsqueda"><ArrowRight size={17} /></button></div>
        <button className={`shop-filter-toggle ${showFilters ? "is-active" : ""}`} type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="catalog-filters"><SlidersHorizontal size={16} /> Filtros{(filters.inStock || filters.maxPrice !== "") && <span className="shop-filter-dot" aria-label="activos" />}</button>
        <div className="shop-sort"><label htmlFor="catalog-sort">Ordenar</label><select id="catalog-sort" name="orden" value={filters.sort} onChange={(event) => update({ sort: event.target.value as StoreFilters["sort"] })}><option value="selection">Selección Galia Luna</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option></select></div>
      </div>
      <div id="catalog-filters" className="shop-filter-panel" hidden={!showFilters}>
        <label className="shop-price-filter" htmlFor="catalog-price">Precio máximo (RD$)<input id="catalog-price" type="number" name="hasta" min="0" max="1000000000" step="0.01" inputMode="decimal" placeholder="Sin límite" value={filters.maxPrice} onChange={(event) => update({ maxPrice: event.target.value }, "replace")} /></label>
        <label className="shop-stock-filter"><input type="checkbox" name="stock" value="1" checked={filters.inStock} onChange={(event) => update({ inStock: event.target.checked })} /><span>Solo stock confirmado<small>Oculta piezas agotadas o con disponibilidad por consultar.</small></span></label>
        <a href={basePath} className="shop-text-link" onClick={(event) => { event.preventDefault(); reset(); }}>Restablecer filtros <X size={14} /></a>
      </div>
    </form>
    <div className="shop-results-summary"><p role="status" aria-live="polite" aria-atomic="true">{results.length} {results.length === 1 ? "pieza" : "piezas"}{filters.q && <> para «{filters.q}»</>}{visible.length < results.length && <> · Mostrando {visible.length}</>}</p>{activeFilters && <a href={basePath} onClick={(event) => { event.preventDefault(); reset(); }} className="shop-text-link">Limpiar <X size={13} /></a>}</div>
    <div id="resultados-catalogo" onClickCapture={(event) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="/product/"]') : null;
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = window.location.pathname + window.location.search;
      window.history.replaceState({ ...window.history.state, galiaCatalog: { url, scrollY: window.scrollY } }, "", url);
    }}>
      {visible.length ? <div className="shop-product-grid">{visible.map((product, index) => <ProductCard key={product._id} product={product} priority={index === 0} />)}</div> : <div className="shop-empty"><Search size={30} strokeWidth={1} /><h2>{activeFilters ? "No encontramos esa combinación." : "Pronto habrá más por descubrir."}</h2><p>{activeFilters ? "Prueba con otro nombre o ajusta los filtros para descubrir más piezas." : "Puedes explorar las demás categorías de nuestra colección."}</p>{activeFilters ? <a href={basePath} className="shop-button shop-button-primary" onClick={(event) => { event.preventDefault(); reset(); }}>Ver todas las piezas</a> : <Link href="/coleccion" className="shop-button shop-button-primary">Explorar la colección</Link>}</div>}
    </div>
    {visible.length < results.length && <div className="shop-load-more"><p>Mostrando {visible.length} de {results.length} piezas</p><div className="shop-progress" aria-hidden="true"><span style={{ width: `${visible.length / results.length * 100}%` }} /></div><a href={basePath + filtersQuery({ ...filters, page: visiblePage + 1 })} className="shop-button shop-button-outline" onClick={(event) => { event.preventDefault(); update({ page: visiblePage + 1 }); }}>Ver más piezas <ArrowRight size={16} /></a></div>}
  </div>;
}
