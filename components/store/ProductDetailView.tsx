"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Plus,
  ShoppingBag,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CALL_OWNER_NUMBER, WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { calculateCartCount, useCartStore } from "../../store/cartStore";
import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  formatDOP,
  toCartProductSnapshot,
  type Product,
} from "../../types/product";
import WhatsAppCheckoutDialog from "./WhatsAppCheckoutDialog";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

function buildProductWhatsAppUrl(product: Product) {
  const text = [
    "Hola Galia Luna, me interesa esta pieza:",
    `${product.name} (${product.category})`,
    `Precio: ${formatDOP(product.price)}`,
    "¿Está disponible?",
  ].join("\n");

  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const gallery = useMemo(
    () =>
      product.images.length > 0
        ? product.images
        : [FALLBACK_PRODUCT_IMAGE],
    [product.images],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const hasMultipleImages = gallery.length > 1;

  const activeImage = gallery[activeIndex] ?? FALLBACK_PRODUCT_IMAGE;
  const productWhatsAppUrl = buildProductWhatsAppUrl(product);
  const directCheckoutItems = useMemo(
    () => [{ ...toCartProductSnapshot(product), quantity: 1 }],
    [product],
  );

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const cartCount = useCartStore((state) => calculateCartCount(state.items));

  const handleAddToCart = () => {
    addItem(toCartProductSnapshot(product), 1);
    openCart();
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [product._id]);

  const goToPrevImage = () => {
    if (!hasMultipleImages) return;
    setActiveIndex((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    setActiveIndex((current) => (current + 1) % gallery.length);
  };

  return (
    <div className="px-4 pb-24 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--line)] bg-[color:var(--panel)]/95 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <span className="inline-block h-px w-7 bg-[color:var(--metal)]" />
            <Link
              href="/"
              className="[font-family:var(--font-playfair)] text-[1.3rem] leading-none tracking-[0.08em] text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
            >
              GALIA LUNA
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver
            </Link>
            <Link
              href="/mi-cuenta"
              className="inline-flex items-center gap-2 border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
            >
              <User className="h-3.5 w-3.5" />
              Mi cuenta
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="inline-flex items-center gap-2 border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Pedido ({cartCount})
            </button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.92fr)] xl:grid-cols-[minmax(0,1.02fr)_24rem]">
          <section className="grid gap-4">
            <div className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--line)] pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                    Fotos de la pieza
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                    {hasMultipleImages
                      ? `Imagen ${activeIndex + 1} de ${gallery.length}`
                      : "1 imagen disponible"}
                  </p>
                </div>

                {hasMultipleImages ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      aria-label="Ver foto anterior"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      aria-label="Ver foto siguiente"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[5.25rem_minmax(0,1fr)]">
                {hasMultipleImages ? (
                  <div className="order-2 grid grid-cols-4 gap-2 lg:order-1 lg:grid-cols-1 lg:content-start">
                    {gallery.map((image, idx) => (
                      <button
                        key={`${image.url}-${idx}`}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Ver imagen ${idx + 1}`}
                        className={`group relative overflow-hidden rounded-[12px] border bg-[color:var(--bg-soft)] p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${
                          activeIndex === idx
                            ? "border-[color:var(--line-strong)]"
                            : "border-[color:var(--line)]"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[8px] bg-[color:var(--paper)]">
                          <Image
                            src={image.url}
                            alt={image.alt || product.name}
                            fill
                            placeholder="blur"
                            blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                            sizes="84px"
                            className="object-cover transition duration-200 group-hover:scale-[1.02]"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className={`relative overflow-hidden border border-[color:var(--line)] bg-[color:var(--bg-soft)] ${hasMultipleImages ? "order-1" : ""}`}>
                  <div className="mx-auto w-full max-w-[820px]">
                    <div className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/4]">
                      <Image
                        src={activeImage.url}
                        alt={activeImage.alt || product.name}
                        fill
                        priority
                        placeholder="blur"
                        blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                        sizes="(max-width: 1024px) 92vw, 52vw"
                        className="object-contain p-5 sm:p-8 lg:p-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {hasMultipleImages ? (
                <p className="mt-3 text-xs text-[color:var(--ink-soft)]">
                  Selecciona otra vista para revisar ángulos y detalles de la pieza.
                </p>
              ) : (
                <p className="mt-3 text-xs text-[color:var(--ink-soft)]">
                  Si deseas ver más ángulos, escríbenos y te enviamos fotos adicionales por WhatsApp.
                </p>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-[5.8rem] lg:self-start">
            <div className="border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                {product.category}
                {product.badge ? ` · ${product.badge}` : ""}
              </p>

              <h1 className="mt-2 [font-family:var(--font-playfair)] text-[2.2rem] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
                {product.name}
              </h1>

              <div className="mt-4 flex items-end justify-between gap-3 border-b border-[color:var(--line)] pb-4">
                <p className="text-xl font-medium text-[color:var(--ink)]">
                  {formatDOP(product.price)}
                </p>
                <p className="text-xs text-[color:var(--ink-soft)]">
                  {product.inventory ? `${product.inventory} disponibles` : "Disponible"}
                </p>
              </div>

              <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
                {product.description}
              </p>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="inline-flex items-center justify-center gap-2 border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-coral)]/45"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Comprar por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar al pedido
                </button>

                <button
                  type="button"
                  onClick={openCart}
                  className="inline-flex items-center justify-center gap-2 border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Ver pedido
                </button>
              </div>

              <div className="mt-6 border-t border-[color:var(--line)] pt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                  Atención personalizada
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                  Te ayudamos a confirmar combinaciones, disponibilidad y forma
                  de entrega por WhatsApp.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={productWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-b border-[color:var(--line)] pb-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:text-[color:var(--metal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Escribir
                  </a>
                  <a
                    href={`tel:+${CALL_OWNER_NUMBER}`}
                    className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)] transition hover:border-[color:var(--line)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Llamar
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {relatedProducts.length > 0 ? (
          <section className="mt-12 border-t border-[color:var(--line)] pt-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                  También disponibles
                </p>
                <h2 className="mt-1 [font-family:var(--font-playfair)] text-[2rem] leading-[0.95] tracking-[-0.03em] text-[color:var(--ink)]">
                  Otras piezas que pueden gustarte
                </h2>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border-b border-[color:var(--line)] pb-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:text-[color:var(--metal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              >
                Ver catálogo completo
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {relatedProducts.slice(0, 4).map((item) => {
                const image = item.images[0] ?? FALLBACK_PRODUCT_IMAGE;
                const itemWhatsappUrl = buildProductWhatsAppUrl(item);

                return (
                  <article
                    key={item._id}
                    className="grid gap-4 border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5"
                  >
                    <Link
                      href={`/product/${item.slug.current}`}
                      className="relative block overflow-hidden border border-[color:var(--line)] bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                    >
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={image.url}
                          alt={image.alt || item.name}
                          fill
                          placeholder="blur"
                          blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line)] pb-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                            {item.category}
                          </p>
                          <h3 className="mt-1 [font-family:var(--font-playfair)] text-[1.4rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-sm font-medium text-[color:var(--ink)]">
                          {formatDOP(item.price)}
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/product/${item.slug.current}`}
                          className="inline-flex items-center gap-2 border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                        >
                          Ver detalle
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={itemWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-coral)]/45"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Consultar
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            addItem(toCartProductSnapshot(item), 1);
                            openCart();
                          }}
                          className="inline-flex items-center gap-2 border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <WhatsAppCheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={directCheckoutItems}
        source="product"
      />
    </div>
  );
}

