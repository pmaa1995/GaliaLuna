"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

import {
  CATEGORY_FILTER_OPTIONS,
  type CategoryFilter,
} from "../../types/product";

interface CategorySegmentProps {
  activeCategory: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

function CategorySegmentComponent({
  activeCategory,
  onChange,
}: CategorySegmentProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav
      aria-label="Categorías de productos"
      className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[color:var(--bg-shell)] via-[color:var(--bg-shell)]/85 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[color:var(--bg-shell)] via-[color:var(--bg-shell)]/85 to-transparent" />

      <div className="overflow-x-auto [scroll-snap-type:x_proximity] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative inline-flex min-w-full items-end gap-6 border-b border-[color:var(--border-warm)] pb-1.5 pt-0.5">
          {CATEGORY_FILTER_OPTIONS.map((option) => {
            const isActive = activeCategory === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                aria-pressed={isActive}
                  className="relative snap-start whitespace-nowrap px-0.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-shell)]"
                >
                  <span
                    className={`[font-family:var(--font-inter)] text-sm tracking-[0.01em] transition duration-200 ease-editorial ${
                      isActive
                        ? "text-[color:var(--ink)]"
                        : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
                    }`}
                  >
                    {option.label}
                  </span>

                {isActive ? (
                  prefersReducedMotion ? (
                    <span className="absolute inset-x-0 bottom-0 h-px bg-[color:var(--accent-gold)]" />
                  ) : (
                    <motion.span
                      layoutId="category-underline"
                      className="absolute inset-x-0 bottom-0 h-px bg-[color:var(--accent-gold)]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 36,
                        mass: 0.4,
                      }}
                    />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const CategorySegment = memo(CategorySegmentComponent);

export default CategorySegment;
