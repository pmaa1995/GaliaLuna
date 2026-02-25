"use client";

import Link from "next/link";
import { memo } from "react";

import type { CategoryFilter } from "../../types/product";
import CategorySegment from "./CategorySegment";

interface StoreHeaderProps {
  cartCount: number;
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onCartClick: () => void;
}

function StoreHeaderComponent({
  cartCount,
  activeCategory,
  onCategoryChange,
  onCartClick,
}: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border-warm)]/70 bg-[color:var(--bg-shell)]/58 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex min-w-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-shell)]"
              aria-label="Ir al inicio de Galia Luna"
            >
              <span className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--ink-soft)]">
                Maison de joieria
              </span>
              <span className="mt-0.5 [font-family:var(--font-playfair)] text-[2rem] leading-none tracking-[-0.02em] text-[color:var(--ink)]">
                Galia Luna
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)] sm:inline">
                Coleccion 2026
              </span>
              <button
                type="button"
                onClick={onCartClick}
                aria-label={`Abrir carrito (${cartCount} artículos)`}
                className="inline-flex items-center gap-2 [font-family:var(--font-inter)] text-sm text-[color:var(--ink)] transition duration-200 ease-editorial hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              >
                <span className="tracking-[0.01em]">Carrito</span>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-[color:var(--border-warm)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--ink)]">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>

          <CategorySegment
            activeCategory={activeCategory}
            onChange={onCategoryChange}
          />
        </div>
      </div>
    </header>
  );
}

const StoreHeader = memo(StoreHeaderComponent);

export default StoreHeader;
