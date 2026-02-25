"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useRef, useState } from "react";

import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  formatDOP,
  type Product,
} from "../../types/product";

type ProductPieceVariant = "feature" | "tall" | "standard";

interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart: (product: Product) => void;
  variant?: ProductPieceVariant;
}

function ProductCardComponent({
  product,
  index,
  onAddToCart,
}: ProductCardProps) {
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const image = product.images[0] ?? FALLBACK_PRODUCT_IMAGE;
  const reversed = index % 2 === 1;

  const handleAdd = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPressed(true);
    onAddToCart(product);
    timeoutRef.current = window.setTimeout(() => setPressed(false), 220);
  };

  return (
    <article className="group">
      <div className="grid items-end gap-5 lg:grid-cols-12 lg:gap-8">
        <div
          className={`${
            reversed
              ? "lg:order-2 lg:col-span-7"
              : "lg:col-span-7"
          }`}
        >
          <Link
            href={`/product/${product.slug.current}`}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-shell)]"
            aria-label={`Ver ${product.name}`}
          >
            <figure className="relative overflow-hidden rounded-[22px] bg-[color:var(--bg-soft)]">
              <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_15%,rgba(199,164,107,0.08),transparent_58%)]" />
              <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[7/6]">
                <Image
                  src={image.url}
                  alt={image.alt || product.name}
                  fill
                  priority={index < 2}
                  placeholder="blur"
                  blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                  sizes="(max-width: 768px) 92vw, (max-width: 1280px) 60vw, 56vw"
                  className="object-cover transition duration-200 ease-editorial group-hover:scale-[1.03]"
                />
              </div>

              <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[color:var(--ink)]/22 via-transparent to-transparent opacity-50 transition duration-200 ease-editorial group-hover:opacity-85" />

              <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[3] translate-y-2 opacity-0 transition duration-200 ease-editorial group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-[color:var(--paper)]/35 bg-[color:var(--ink)]/12 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--paper)] backdrop-blur-sm">
                    Ver pieza
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleAdd();
                    }}
                    aria-label={`Agregar ${product.name} al carrito`}
                    className={`pointer-events-auto rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--paper)] backdrop-blur-sm transition duration-200 ease-editorial ${
                      pressed
                        ? "border-[color:var(--accent-gold)]/40 bg-[color:var(--accent-gold)]/20"
                        : "border-[color:var(--paper)]/35 bg-[color:var(--ink)]/12 hover:bg-[color:var(--ink)]/20"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--paper)]/45`}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </figure>
          </Link>
        </div>

        <div
          className={`${
            reversed
              ? "lg:order-1 lg:col-span-4 lg:col-start-1"
              : "lg:col-span-4 lg:col-start-9"
          } ${reversed ? "lg:pb-6" : "lg:pb-10"}`}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            {product.category}
          </p>
          <Link
            href={`/product/${product.slug.current}`}
            className="mt-2 block [font-family:var(--font-playfair)] text-[2rem] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)] transition duration-200 ease-editorial hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] sm:text-[2.35rem]"
          >
            {product.name}
          </Link>

          <p className="mt-4 [font-family:var(--font-inter)] text-sm leading-7 text-[color:var(--ink-soft)]">
            {product.description}
          </p>

          <div className="mt-6 h-px w-full bg-gradient-to-r from-[color:var(--accent-gold)]/45 via-[color:var(--border-warm)] to-transparent" />

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {product.badge ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  {product.badge}
                </span>
              ) : null}
              <span className="[font-family:var(--font-inter)] text-sm text-[color:var(--ink)]">
                {formatDOP(product.price)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Agregar ${product.name} al carrito`}
              className={`inline-flex items-center [font-family:var(--font-inter)] text-xs uppercase tracking-[0.14em] transition duration-200 ease-editorial ${
                pressed
                  ? "text-[color:var(--accent-gold)]"
                  : "text-[color:var(--ink)] hover:opacity-70"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]`}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const ProductCard = memo(ProductCardComponent);

export default ProductCard;
