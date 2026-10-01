"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, X, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { collectionCategories } from "../../lib/storefront";
import { calculateCartCount, useCartStore } from "../../store/cartStore";
import useModalAccessibility from "./useModalAccessibility";

export default function StoreHeader() {
  const pathname = usePathname();
  const count = useCartStore((state) => calculateCartCount(state.items));
  const openCart = useCartStore((state) => state.openCart);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => setSearchOpen(false), [pathname]);
  useModalAccessibility(searchRef, searchOpen, () => setSearchOpen(false));
  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <div className="shop-announcement">Piezas con carácter. Atención personal.</div>
      <header className="shop-header">
        <div className="shop-header-main">
          <button className="shop-icon-button shop-search-trigger" aria-label="Buscar piezas" aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
            <Search size={19} aria-hidden="true" /><span>Buscar</span>
          </button>
          <Link href="/" className="shop-wordmark" aria-label="Galia Luna, inicio">Galia Luna<span>JOYERÍA & ACCESORIOS</span></Link>
          <div className="shop-header-actions">
            <Link href="/mi-cuenta" className="shop-icon-button shop-account" aria-label="Mi cuenta"><User size={19} aria-hidden="true" /></Link>
            <button className="shop-icon-button shop-bag" onClick={openCart} aria-label={`Abrir pedido (${mounted ? count : 0} piezas)`} aria-haspopup="dialog"><ShoppingBag size={19} aria-hidden="true" /><span className="shop-count">{mounted ? count : 0}</span></button>
          </div>
        </div>
        <nav aria-label="Colecciones" className="shop-category-nav">
          <Link href="/coleccion" aria-current={pathname === "/coleccion" ? "page" : undefined}>Ver todo</Link>
          {collectionCategories.map(({ slug, label }) => <Link key={slug} href={`/coleccion/${slug}`} aria-current={pathname === `/coleccion/${slug}` ? "page" : undefined}>{label}</Link>)}
        </nav>
      </header>
      {searchOpen && <div className="shop-search-overlay" onClick={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <div ref={searchRef} role="dialog" aria-modal="true" aria-labelledby="shop-search-title" tabIndex={-1} className="shop-search-dialog">
          <div className="shop-dialog-heading"><h2 id="shop-search-title">Encuentra tu próxima pieza</h2><button className="shop-icon-button" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda"><X size={22} /></button></div>
          <form action="/coleccion" className="shop-search-form">
            <label className="sr-only" htmlFor="global-search">Buscar piezas</label>
            <input id="global-search" type="search" name="q" maxLength={120} placeholder="Prueba con anillos, caracol…" data-modal-initial-focus autoComplete="off" />
            <button type="submit" aria-label="Buscar en la colección"><ArrowRight size={24} /></button>
          </form>
          <p className="shop-eyebrow">Explora por categoría</p>
          <div className="shop-search-categories">{collectionCategories.map(({ slug, label }) => <Link key={slug} href={`/coleccion/${slug}`} onClick={() => setSearchOpen(false)}>{label}<ArrowRight size={16} /></Link>)}</div>
        </div>
      </div>}
    </>
  );
}
