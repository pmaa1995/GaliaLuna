"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { memo, useEffect, useState } from "react";

import {
  calculateCartCount,
  calculateCartTotal,
  useCartStore,
} from "../../store/cartStore";
import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  formatDOP,
} from "../../types/product";
import WhatsAppCheckoutDialog from "./WhatsAppCheckoutDialog";

function buildWhatsAppMessage(
  items: ReturnType<typeof useCartStore.getState>["items"],
  total: number,
) {
  const lines = items.map(
    (item) => `- ${item.quantity}x ${item.name} (${formatDOP(item.price)})`,
  );

  return [
    "Hola Galia Luna, quiero confirmar este pedido de la web:",
    ...lines,
    `Total estimado: ${formatDOP(total)}`,
    "Compárteme por favor formas de pago, entrega y disponibilidad.",
  ].join("\n");
}

function buildWhatsAppCheckoutUrl(
  items: ReturnType<typeof useCartStore.getState>["items"],
  total: number,
) {
  return `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(items, total),
  )}`;
}

interface CartLineItemProps {
  item: ReturnType<typeof useCartStore.getState>["items"][number];
  onRemove: (id: string) => void;
  onIncrease: (id: string, quantity: number) => void;
  onDecrease: (id: string, quantity: number) => void;
}

const CartLineItem = memo(function CartLineItem({
  item,
  onRemove,
  onIncrease,
  onDecrease,
}: CartLineItemProps) {
  return (
    <li className="grid grid-cols-[4.2rem_minmax(0,1fr)] gap-3 border border-[color:var(--line)] bg-[color:var(--paper)] p-3">
      <div className="relative h-[5rem] overflow-hidden border border-[color:var(--line)] bg-[color:var(--bg-soft)]">
        <Image
          src={item.imageUrl || FALLBACK_PRODUCT_IMAGE.url}
          alt={item.imageAlt || item.name}
          fill
          placeholder="blur"
          blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              {item.category}
            </p>
            <p className="truncate [font-family:var(--font-playfair)] text-[1.12rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
              {item.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Eliminar ${item.name}`}
            className="inline-flex h-7 w-7 items-center justify-center border border-transparent text-[color:var(--ink-soft)] transition hover:border-[color:var(--line)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="inline-flex items-center border border-[color:var(--line)] bg-[color:var(--bg-soft)]">
            <button
              type="button"
              onClick={() => onDecrease(item.id, item.quantity)}
              className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              aria-label={`Reducir ${item.name}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 text-center text-sm text-[color:var(--ink)]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(item.id, item.quantity)}
              className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sand)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              aria-label={`Aumentar ${item.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-[color:var(--ink-soft)]">
              {formatDOP(item.price)} c/u
            </p>
            <p className="text-sm font-medium text-[color:var(--ink)]">
              {formatDOP(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
});

export default function CartDrawer() {
  const prefersReducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeCart, hasMounted, isOpen]);

  const safeItems = hasMounted ? items : [];
  const safeIsOpen = hasMounted ? isOpen : false;
  const total = calculateCartTotal(safeItems);
  const totalItems = calculateCartCount(safeItems);

  return (
    <>
      <button
        type="button"
        onClick={openCart}
        aria-label={`Abrir pedido (${totalItems})`}
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] shadow-[0_12px_28px_rgba(43,42,40,0.12)] transition duration-200 ease-editorial hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${
          safeIsOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Pedido ({totalItems})
      </button>

      <AnimatePresence initial={false}>
        {safeIsOpen ? (
          <motion.aside
            key="cart"
            role="dialog"
            aria-modal="false"
            aria-label="Tu pedido"
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 18 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-3 right-3 top-3 z-50 flex w-[min(420px,calc(100vw-1rem))] flex-col border border-[color:var(--line-strong)] bg-[color:var(--panel)] shadow-[0_24px_70px_rgba(43,42,40,0.16)]"
          >
            <header className="border-b border-[color:var(--line)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                    Resumen del pedido
                  </p>
                  <h2 className="mt-1 [font-family:var(--font-playfair)] text-[1.7rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
                    Tu pedido ({totalItems})
                  </h2>
                  <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                    Envíalo por WhatsApp cuando estés listo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Cerrar pedido"
                  className="inline-flex h-8 w-8 items-center justify-center border border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {safeItems.length === 0 ? (
                <div className="flex h-full flex-col justify-center border border-[color:var(--line)] bg-[color:var(--paper)] p-5 text-left">
                  <p className="[font-family:var(--font-playfair)] text-[1.5rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
                    Tu pedido está vacío
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                    Agrega piezas desde el catálogo y confírmalo por WhatsApp cuando quieras.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {safeItems.map((item) => (
                    <CartLineItem
                      key={item.id}
                      item={item}
                      onRemove={removeItem}
                      onIncrease={(id, quantity) => setQuantity(id, quantity + 1)}
                      onDecrease={(id, quantity) => setQuantity(id, quantity - 1)}
                    />
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
              <div className="space-y-2 border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3">
                <div className="flex items-center justify-between text-sm text-[color:var(--ink-soft)]">
                  <span>Piezas</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--ink)]">
                  <span>Total</span>
                  <span>{formatDOP(total)}</span>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {safeItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="inline-flex items-center justify-center gap-2 border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-coral)]/45"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar pedido por WhatsApp
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar pedido por WhatsApp
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={safeItems.length === 0}
                  className="inline-flex items-center justify-center border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  Vaciar pedido
                </button>
              </div>
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <WhatsAppCheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={safeItems}
        source="cart"
        onSubmitted={closeCart}
      />
    </>
  );
}
