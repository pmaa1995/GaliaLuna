"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Globe,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CALL_OWNER_NUMBER, WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { calculateCartCount, useCartStore } from "../../store/cartStore";
import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  formatDOP,
  toCartProductSnapshot,
  type CategoryFilter,
  type Product,
} from "../../types/product";

interface ProductGridProps {
  products: Product[];
  heroProducts?: Product[];
  featuredProduct?: Product;
}

const TONES = [
  "bg-[color:var(--bg-shell)]",
  "bg-[color:var(--hero-rose)]",
  "bg-[color:var(--brand-sand)]",
  "bg-[color:var(--band-sky)]",
  "bg-[color:var(--bg-shell)]",
  "bg-[color:var(--band-aqua)]",
] as const;

function primaryImage(product: Product) {
  return product.images[0] ?? FALLBACK_PRODUCT_IMAGE;
}

function waUrl(message: string) {
  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(message)}`;
}

function productWa(product: Product) {
  return waUrl(
    `Hola Galia Luna, me interesa ${product.name} (${product.category}) por ${formatDOP(product.price)}. ¿Está disponible?`,
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.8rem,3vw,2.8rem)] leading-[0.94] tracking-[-0.03em] text-[color:var(--ink)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-[68ch] text-sm leading-7 text-[color:var(--ink-soft)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function ProductGrid({
  products,
  heroProducts,
  featuredProduct,
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [hasMounted, setHasMounted] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const cartCount = useCartStore((state) => calculateCartCount(state.items));

  useEffect(() => setHasMounted(true), []);

  const visibleCartCount = hasMounted ? cartCount : 0;
  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? products
        : products.filter((p) => p.category === activeCategory),
    [activeCategory, products],
  );

  const hero = (heroProducts && heroProducts.length > 0 ? heroProducts : products).slice(0, 3);
  const featured = featuredProduct ?? products.find((p) => p.badge) ?? products[0];
  const top3 = filtered.slice(0, 3);
  const rows = filtered.slice(3);
  const stories = [products[2], products[4] ?? products[1]].filter(Boolean) as Product[];
  const generalWa = waUrl("Hola Galia Luna, necesito ayuda para elegir una pieza.");

  const onAdd = (product: Product) => {
    addItem(toCartProductSnapshot(product), 1);
    openCart();
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-40">
        <header className="border-b border-[color:var(--line)] bg-[color:var(--band-sky)] text-[color:var(--ink)]">
          <div className="mx-auto grid h-20 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-24 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Buscar" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--paper)]/25 bg-[color:var(--paper)]/10">
                <Search className="h-4 w-4" />
              </button>
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full border border-[color:var(--paper)]/25 bg-[color:var(--paper)]/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] sm:inline-flex">
                <MessageCircle className="h-3.5 w-3.5" />
                Asesoría
              </a>
            </div>

            <Link href="/" className="text-center [font-family:var(--font-playfair)] text-[1.95rem] leading-[0.84] tracking-[-0.04em] sm:text-[2.35rem]">
              Galia
              <br />
              Luna
            </Link>

            <div className="flex items-center justify-end gap-2">
              <Link
                href="/mi-cuenta"
                aria-label="Mi cuenta"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--paper)]/25 bg-[color:var(--paper)]/10 transition hover:bg-[color:var(--paper)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              >
                <User className="h-4 w-4" />
              </Link>
              <button type="button" onClick={openCart} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--paper)]/25 bg-[color:var(--paper)]/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em]">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pedido</span>({visibleCartCount})
              </button>
            </div>
          </div>
        </header>

        <nav className="border-b border-[color:var(--line)] bg-[color:var(--band-aqua)]">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="hidden items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] md:flex">
              <a href="#inicio" className="border-b border-[color:var(--ink)] pb-1">Inicio</a>
              <a href="#catalogo">Catálogo</a>
              <a href="#colecciones">Colecciones</a>
              <a href="#contacto">Contacto</a>
            </div>
            <div className="flex w-full items-center justify-between gap-3 md:w-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--paper)]/55 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)]">
                <Sparkles className="h-3.5 w-3.5" />
                Compra guiada por WhatsApp
              </div>
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        </nav>
      </div>

      <main id="inicio" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden border-x border-b border-[color:var(--line)] bg-[color:var(--bg-shell)]">
          <div className="grid min-h-[420px] lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <div className="flex flex-col justify-center border-b border-[color:var(--line)] px-6 py-8 lg:border-b-0 lg:border-r">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Compra directa con asesoría</p>
              <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.3rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
                Alta joyería artesanal edición limitada.
              </h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Explora las piezas disponibles, agrega tus favoritas al pedido y confirma por WhatsApp cuando estés listo.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={generalWa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Hablar con asesora
                </a>
                <a href="#catalogo" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]/55 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                  Ver catálogo
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="relative min-h-[320px] border-b border-[color:var(--line)] bg-[color:var(--hero-rose)] lg:border-b-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(241,236,228,0.48),transparent_38%),radial-gradient(circle_at_86%_82%,rgba(169,201,192,0.18),transparent_40%),radial-gradient(circle_at_55%_65%,rgba(223,163,157,0.14),transparent_44%)]" />
              {hero.map((item, idx) => {
                const img = primaryImage(item);
                const positions = [
                  "left-[8%] top-[13%] h-[56%] w-[31%] rotate-[-8deg]",
                  "left-[34%] top-[18%] h-[66%] w-[34%]",
                  "right-[9%] top-[28%] h-[50%] w-[29%] rotate-[7deg]",
                ];
                return (
                  <div key={item._id} className={`absolute overflow-hidden rounded-[18px] border border-[color:var(--paper)]/65 bg-[color:var(--paper)]/50 shadow-[0_16px_36px_rgba(43,42,40,0.14)] ${positions[idx] || positions[0]}`}>
                    <Image src={img.url} alt={img.alt || item.name} fill priority placeholder="blur" blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL} sizes="240px" className="object-cover" />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col justify-center gap-4 px-6 py-8">
              {featured ? (
                <div className="rounded-[20px] border border-[color:var(--paper)]/55 bg-[color:var(--paper)]/55 p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Destacado</p>
                  <h3 className="mt-1 [font-family:var(--font-playfair)] text-[1.6rem] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">{featured.name}</h3>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{featured.category} · {formatDOP(featured.price)}</p>
                  <div className="mt-4 grid gap-2">
                    <a href={productWa(featured)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                      <MessageCircle className="h-3.5 w-3.5" />Consultar pieza
                    </a>
                    <button type="button" onClick={() => onAdd(featured)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]/65 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                      <ShoppingBag className="h-3.5 w-3.5" />Agregar al pedido
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="rounded-[20px] border border-[color:var(--paper)]/45 bg-[color:var(--paper)]/45 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Compra clara</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">Precios visibles, pedido opcional y confirmación directa por WhatsApp.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-[color:var(--line)] bg-[color:var(--ticker-lime)]">
          <div className="marquee-track flex w-max items-center">
            {Array.from({ length: 2 }).map((_, groupIdx) => (
              <div
                key={groupIdx}
                className="flex shrink-0 items-center gap-8 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] sm:gap-12 sm:px-6"
                aria-hidden={groupIdx === 1}
              >
                {Array.from({ length: 8 }).map((__, i) => (
                  <span key={`${groupIdx}-${i}`} className="inline-flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Joyería artesanal · WhatsApp · Entrega coordinada
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
        <section id="catalogo" className="py-10">
          <SectionHeading
            eyebrow="Catálogo"
            title="Piezas disponibles"
            description="Consulta precios, detalles y disponibilidad. Puedes comprar desde la web o escribirnos por WhatsApp para recibir ayuda."
          />

          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`border-b pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                activeCategory === "all"
                  ? "border-[color:var(--line-strong)] text-[color:var(--ink)]"
                  : "border-transparent text-[color:var(--ink-soft)]"
              }`}
            >
              Todas
            </button>
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`border-b pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  activeCategory === category
                    ? "border-[color:var(--line-strong)] text-[color:var(--ink)]"
                    : "border-transparent text-[color:var(--ink-soft)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6">
              <p className="[font-family:var(--font-playfair)] text-2xl text-[color:var(--ink)]">
                No hay piezas disponibles en esta categoría.
              </p>
              <a
                href={generalWa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
              >
                <MessageCircle className="h-3.5 w-3.5" />Consultar por WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-3">
                {top3.map((product, index) => {
                  const img = primaryImage(product);
                  return (
                    <article key={product._id} className="overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)]">
                      <Link
                        href={`/product/${product.slug.current}`}
                        className={`block border-b border-[color:var(--line)] p-4 ${TONES[index % TONES.length]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]`}
                      >
                        <div className="relative mx-auto aspect-[4/5] w-full max-w-[330px] overflow-hidden rounded-[18px] border border-[color:var(--paper)]/60 bg-[color:var(--paper)]/35 shadow-[0_16px_36px_rgba(43,42,40,0.12)]">
                          <Image
                            src={img.url}
                            alt={img.alt || product.name}
                            fill
                            placeholder="blur"
                            blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                            sizes="(max-width: 1024px) 92vw, 30vw"
                            className="object-cover"
                          />
                        </div>
                      </Link>
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                          {product.category}
                          {product.badge ? ` · ${product.badge}` : ""}
                        </p>
                        <h3 className="mt-1 [font-family:var(--font-playfair)] text-[1.35rem] leading-[0.96] tracking-[-0.02em] text-[color:var(--ink)]">
                          {product.name}
                        </h3>
                        <p className="mt-2 text-lg font-medium text-[color:var(--ink)]">
                          {formatDOP(product.price)}
                        </p>
                        <div className="mt-4 grid gap-2">
                          <button
                            type="button"
                            onClick={() => onAdd(product)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />Agregar al pedido
                          </button>
                          <div className="flex gap-2">
                            <a
                              href={productWa(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                            </a>
                            <Link
                              href={`/product/${product.slug.current}`}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]"
                            >
                              Ver<ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {rows.length > 0 ? (
                <div className="mt-8 space-y-5">
                  {rows.map((product, index) => {
                    const img = primaryImage(product);
                    return (
                      <article
                        key={product._id}
                        className="grid gap-4 border border-[color:var(--line)] bg-[color:var(--paper)] p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center md:p-5"
                      >
                        <Link
                          href={`/product/${product.slug.current}`}
                          className={`block overflow-hidden rounded-[18px] border border-[color:var(--line)] ${TONES[(index + 3) % TONES.length]} p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]`}
                        >
                          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] border border-[color:var(--paper)]/55 bg-[color:var(--paper)]/35">
                            <Image
                              src={img.url}
                              alt={img.alt || product.name}
                              fill
                              placeholder="blur"
                              blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                              sizes="220px"
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line)] pb-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                                {product.category}
                                {product.badge ? ` · ${product.badge}` : ""}
                              </p>
                              <h3 className="mt-1 [font-family:var(--font-playfair)] text-[1.7rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
                                {product.name}
                              </h3>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-medium text-[color:var(--ink)]">{formatDOP(product.price)}</p>
                              <p className="text-xs text-[color:var(--ink-soft)]">
                                {product.inventory ? `${product.inventory} disponibles` : "Disponible"}
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">{product.description}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => onAdd(product)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                              <ShoppingBag className="h-3.5 w-3.5" />Agregar al pedido
                            </button>
                            <a href={productWa(product)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                              <MessageCircle className="h-3.5 w-3.5" />Consultar
                            </a>
                            <Link href={`/product/${product.slug.current}`} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                              Ver detalle<ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}
        </section>

        <section id="colecciones" className="py-2">
          <SectionHeading
            eyebrow="Colecciones"
            title="Selecciones para regalar y usar a diario"
            description="Una guía rápida con piezas recomendadas para combinar, regalar y acompañarte en ocasiones especiales."
          />
          <div className="space-y-8">
            {stories.map((product, index) => {
              const img = primaryImage(product);
              const reverse = index % 2 === 1;
              const tone = reverse
                ? "bg-[color:var(--bg-shell)]"
                : "bg-[color:var(--bg-shell)]";
              return (
                <article key={product._id} className="grid overflow-hidden border border-[color:var(--line)] bg-[color:var(--paper)] lg:grid-cols-2">
                  <div className={`${reverse ? "order-2" : ""} ${tone} p-6`}>
                    <div className="relative mx-auto aspect-[5/4] w-full max-w-[520px] overflow-hidden rounded-[22px] border border-[color:var(--paper)]/65 bg-[color:var(--paper)]/35 shadow-[0_16px_36px_rgba(43,42,40,0.10)]">
                      <Image src={img.url} alt={img.alt || product.name} fill placeholder="blur" blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL} sizes="(max-width: 1024px) 92vw, 44vw" className="object-cover" />
                    </div>
                  </div>
                  <div className={`${reverse ? "order-1" : ""} flex items-center p-6 sm:p-8`}>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">Selección recomendada</p>
                      <h3 className="mt-2 [font-family:var(--font-playfair)] text-[clamp(1.8rem,3vw,2.6rem)] leading-[0.94] tracking-[-0.03em] text-[color:var(--ink)]">{product.name}</h3>
                      <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">{product.category} · {formatDOP(product.price)}</p>
                      <p className="mt-3 max-w-[45ch] text-sm leading-7 text-[color:var(--ink-soft)]">{product.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => onAdd(product)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                          <ShoppingBag className="h-3.5 w-3.5" />Agregar al pedido
                        </button>
                        <a href={productWa(product)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                          <MessageCircle className="h-3.5 w-3.5" />Consultar
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="contacto" className="mt-10 overflow-hidden border border-[color:var(--line)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[color:var(--bg-shell)] px-6 py-7 sm:px-8">
              <h3 className="[font-family:var(--font-playfair)] text-[clamp(1.8rem,3vw,2.7rem)] leading-[0.95] tracking-[-0.03em] text-[color:var(--ink)]">
                ¿Quieres ayuda para elegir?
              </h3>
              <p className="mt-3 max-w-[50ch] text-sm leading-7 text-[color:var(--ink-soft)]">
                La web organiza el catálogo; la asesora te ayuda a comparar piezas,
                confirmar disponibilidad y cerrar tu pedido por WhatsApp.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={generalWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />Escribir por WhatsApp
                </a>
                <a
                  href={`tel:+${CALL_OWNER_NUMBER}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <Phone className="h-3.5 w-3.5" />Llamar
                </a>
              </div>
            </div>

            <div className="bg-[color:var(--paper)] px-6 py-7 sm:px-8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Atención y entrega
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--ink)]">
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-sage)]" />
                  Confirmamos disponibilidad antes de cerrar el pedido.
                </li>
                <li className="flex items-start gap-3">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-sage)]" />
                  Revisamos contigo piezas, precio y entrega.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-sage)]" />
                  Coordinamos entrega o envío con seguimiento.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden border border-[color:var(--line)] bg-[color:var(--bg-shell)]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5">
            {[
              [MapPin, "Entrega", "Coordinada según tu zona en RD."],
              [Truck, "Envíos", "Opciones locales y nacionales disponibles."],
              [Package, "Pedido", "Arma tu pedido en la web y confírmalo por WhatsApp."],
              [ShieldCheck, "Soporte", "Acompañamiento antes y después de la compra."],
              [Globe, "Consulta", "Asesoría online para elegir tu pieza."],
            ].map(([Icon, title, text], idx) => {
              const Cmp = Icon as typeof MapPin;
              return (
                <div
                  key={String(title)}
                  className={`px-5 py-6 text-center ${
                    idx > 0 ? "border-t border-[color:var(--paper)]/35 sm:border-l sm:border-t-0" : ""
                  }`}
                >
                  <Cmp className="mx-auto h-10 w-10 text-[color:var(--brand-sage)]" />
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                    {title as string}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{text as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 border-t border-[color:var(--line)] pb-10 pt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="[font-family:var(--font-playfair)] text-[1.5rem] tracking-[-0.02em] text-[color:var(--ink)]">
                Galia Luna
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Joyería artesanal hecha a mano, con atención cercana y compra guiada por WhatsApp.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Navegación
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--ink)]">
                <a href="#inicio">Inicio</a>
                <a href="#catalogo">Catálogo</a>
                <a href="#colecciones">Colecciones</a>
                <a href="#contacto">Contacto</a>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Contacto directo
              </p>
              <div className="mt-3 grid gap-2">
                <a
                  href={generalWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                </a>
                <a
                  href={`tel:+${CALL_OWNER_NUMBER}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <Phone className="h-3.5 w-3.5" />Llamar
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[color:var(--line)] pt-4 text-center">
            <p className="text-xs text-[color:var(--ink-soft)]">
              Sitio construido por{" "}
              <a
                href="https://www.planosweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[color:var(--ink)] transition hover:text-[color:var(--brand-sage)]"
              >
                Planos Web
              </a>{" "}
              ·{" "}
              <a
                href="https://www.planosweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[color:var(--line-strong)] underline-offset-4 transition hover:text-[color:var(--brand-sage)]"
              >
                www.planosweb.com
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}




