"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Plus, X, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { categoryHref } from "../../lib/storefront";
import { useCartStore } from "../../store/cartStore";
import { FALLBACK_PRODUCT_IMAGE, PRODUCT_IMAGE_BLUR_DATA_URL, formatDOP, toCartProductSnapshot, type Product } from "../../types/product";
import ProductCard from "./ProductCard";
import ProgressiveImage from "./ProgressiveImage";
import useModalAccessibility from "./useModalAccessibility";
import type { WhatsAppCheckoutSubmitResult } from "./WhatsAppCheckoutDialog";
import "./product-detail.css";

const WhatsAppCheckoutDialog = dynamic(() => import("./WhatsAppCheckoutDialog"), { ssr: false });

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

function productWhatsAppUrl(product: Product) {
  const message = `Hola Galia Luna, me interesa ${product.name} (${product.category}), por ${formatDOP(product.price)}. ¿Podrían orientarme sobre esta pieza y su disponibilidad?`;
  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const gallery = useMemo(() => product.images.length ? product.images : [FALLBACK_PRODUCT_IMAGE], [product.images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastDirectOrder, setLastDirectOrder] = useState<WhatsAppCheckoutSubmitResult | null>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const hasConfirmedStock = typeof product.inventory === "number" && Number.isSafeInteger(product.inventory) && product.inventory > 0;
  const canOrder = product.inventory == null || hasConfirmedStock;
  const activeImage = gallery[activeIndex] ?? gallery[0];
  const hasMultipleImages = gallery.length > 1;
  const enquiryHref = productWhatsAppUrl(product);
  const directCheckoutItems = useMemo(() => [{ ...toCartProductSnapshot(product), quantity: 1 }], [product]);

  useModalAccessibility(zoomRef, isZoomOpen, () => setIsZoomOpen(false));

  useEffect(() => {
    setActiveIndex(0);
    setIsZoomOpen(false);
    setIsCheckoutOpen(false);
    setLastDirectOrder(null);
  }, [product._id]);

  const previousImage = () => setActiveIndex((index) => (index - 1 + gallery.length) % gallery.length);
  const nextImage = () => setActiveIndex((index) => (index + 1) % gallery.length);
  const addToOrder = (item: Product) => {
    if (item.inventory != null && (!Number.isSafeInteger(item.inventory) || item.inventory <= 0)) return;
    addItem(toCartProductSnapshot(item), 1);
    openCart();
  };

  return (
    <div className="pdp">
      <nav aria-label="Migas de pan" className="pdp__breadcrumb">
        <ol>
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/coleccion">Colección</Link></li>
          <li><Link href={categoryHref(product.category)}>{product.category}</Link></li>
        </ol>
      </nav>

      <div className="pdp__layout">
        <section className="pdp__gallery" aria-label={`Imágenes de ${product.name}`}>
          <button type="button" className="pdp__image-stage" onClick={() => setIsZoomOpen(true)} aria-label={`Ampliar imagen de ${product.name}`}>
            <ProgressiveImage src={activeImage.url} alt={activeImage.alt || product.name} fill priority={activeIndex === 0} quality={85}
              placeholder="blur" blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1439px) 54vw, 704px" className="pdp__image" />
            <span className="pdp__zoom-hint" aria-hidden="true"><ZoomIn size={16} />Ampliar</span>
          </button>

          {hasMultipleImages ? (
            <div className="pdp__gallery-toolbar">
              <p role="status" aria-live="polite" aria-atomic="true">Imagen {activeIndex + 1} de {gallery.length}</p>
              <div className="pdp__gallery-arrows">
                <button type="button" onClick={previousImage} aria-label="Ver foto anterior"><ChevronLeft size={18} /></button>
                <button type="button" onClick={nextImage} aria-label="Ver foto siguiente"><ChevronRight size={18} /></button>
              </div>
            </div>
          ) : null}

          {hasMultipleImages ? (
            <div className="pdp__thumbnails" aria-label="Vistas de la pieza">
              {gallery.map((image, index) => (
                <button type="button" key={`${image.url}-${index}`} onClick={() => setActiveIndex(index)}
                  aria-label={`Ver imagen ${index + 1}`} aria-pressed={activeIndex === index} className="pdp__thumbnail">
                  <ProgressiveImage src={image.url} alt="" fill sizes="72px" quality={60} className="pdp__image" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="pdp__summary" aria-labelledby="product-title">
          <p className="pdp__eyebrow">{product.category}{product.badge ? ` · ${product.badge}` : ""}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="pdp__price">{formatDOP(product.price)}</p>
          <p className={`pdp__availability${hasConfirmedStock ? " pdp__availability--available" : ""}`}>
            {product.inventory === 0 ? "Agotado" : hasConfirmedStock ? `${product.inventory} ${product.inventory === 1 ? "pieza disponible" : "piezas disponibles"}` : "Disponibilidad por confirmar"}
          </p>

          <div className="pdp__purchase">
            <button type="button" className="pdp__button pdp__button--primary" disabled={!canOrder} onClick={() => addToOrder(product)}>
              <Plus size={17} aria-hidden="true" />{canOrder ? "Añadir al pedido" : product.inventory === 0 ? "Agotado" : "Disponibilidad por confirmar"}
            </button>
            {canOrder ? (
              <button type="button" className="pdp__button pdp__button--secondary" onClick={() => setIsCheckoutOpen(true)}>
                <MessageCircle size={17} aria-hidden="true" />Comprar esta pieza por WhatsApp
              </button>
            ) : (
              <a href={enquiryHref} target="_blank" rel="noopener noreferrer" className="pdp__button pdp__button--secondary">
                <MessageCircle size={17} aria-hidden="true" />Consultar por WhatsApp
              </a>
            )}
            <p className="pdp__purchase-note">El pago y la entrega se confirman con una asesora por WhatsApp. Puedes comprar sin crear una cuenta.{canOrder ? <> <a href={enquiryHref} target="_blank" rel="noopener noreferrer">¿Tienes dudas? Escríbenos.</a></> : null}</p>
          </div>

          {lastDirectOrder?.ok ? (
            <div className="pdp__confirmation" role="status">
              <p className="pdp__eyebrow">Pedido preparado</p>
              <p>Confirma el envío del mensaje en WhatsApp para continuar con tu compra.</p>
              {lastDirectOrder.persisted && lastDirectOrder.orderCode ? (
                <>
                  <p className="pdp__order-code">Registrado con código {lastDirectOrder.orderCode}.</p>
                  {lastDirectOrder.signedIn ? <Link href={`/mi-cuenta/pedidos/${encodeURIComponent(lastDirectOrder.orderCode)}`}>Ver pedido en progreso <ArrowRight size={14} /></Link> : null}
                </>
              ) : null}
            </div>
          ) : null}

          <div className="pdp__details">
            <details open>
              <summary>Detalles de la pieza<Plus size={16} aria-hidden="true" /></summary>
              <div><p>{product.description || "Escríbenos para conocer más detalles de esta pieza."}</p></div>
            </details>
            <details>
              <summary>Entrega y atención<Plus size={16} aria-hidden="true" /></summary>
              <div>
                <p>Coordinamos la entrega por WhatsApp según tu ubicación y la disponibilidad de la pieza. Confirmaremos contigo el método y el tiempo estimado antes de despachar.</p>
                <Link href="/envios">Consultar envíos y entregas <ArrowRight size={14} /></Link>
              </div>
            </details>
            <details>
              <summary>Cambios y devoluciones<Plus size={16} aria-hidden="true" /></summary>
              <div>
                <p>Los cambios y devoluciones se evalúan según el estado de la pieza y las condiciones de compra. Consulta la política antes de confirmar tu pedido.</p>
                <Link href="/cambios-y-devoluciones">Ver la política <ArrowRight size={14} /></Link>
              </div>
            </details>
          </div>
        </section>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="pdp__related" aria-labelledby="related-title">
          <div className="pdp__related-heading"><h2 id="related-title">Completa tu selección</h2><Link href={categoryHref(product.category)}>Ver más {product.category.toLocaleLowerCase("es")} <ArrowRight size={16} /></Link></div>
          <div className="pdp__related-grid">{relatedProducts.slice(0, 4).map((item, index) => <ProductCard key={item._id} product={item} index={index} onAddToCart={addToOrder} />)}</div>
        </section>
      ) : null}

      {isZoomOpen ? (
        <div className="pdp-zoom" onClick={(event) => { if (event.target === event.currentTarget) setIsZoomOpen(false); }}>
          <div ref={zoomRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pdp-image-title" className="pdp-zoom__dialog"
            onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); if (event.key === "ArrowRight") nextImage(); else previousImage(); } }}>
            <header><h2 id="pdp-image-title">{product.name}</h2><button type="button" aria-label="Cerrar imagen ampliada" onClick={() => setIsZoomOpen(false)}><X size={22} /></button></header>
            <div className="pdp-zoom__image"><ProgressiveImage src={activeImage.url} alt={activeImage.alt || product.name} fill sizes="90vw" quality={90} className="pdp__image" /></div>
            <div className="pdp-zoom__controls">
              <button type="button" disabled={!hasMultipleImages} aria-label="Ver foto anterior" onClick={previousImage}><ChevronLeft size={20} /></button>
              <p role="status" aria-live="polite">Imagen {activeIndex + 1} de {gallery.length}</p>
              <button type="button" disabled={!hasMultipleImages} aria-label="Ver foto siguiente" onClick={nextImage}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      ) : null}

      {isCheckoutOpen ? <WhatsAppCheckoutDialog open onClose={() => setIsCheckoutOpen(false)} items={directCheckoutItems} source="product" onSubmitted={setLastDirectOrder} /> : null}
    </div>
  );
}
