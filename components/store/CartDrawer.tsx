"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import {
  calculateCartCount,
  calculateCartTotal,
  useCartStore,
} from "../../store/cartStore";
import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  formatDOP,
} from "../../types/product";
import WhatsAppCheckoutDialog from "./WhatsAppCheckoutDialog";
import type { WhatsAppCheckoutSubmitResult } from "./WhatsAppCheckoutDialog";
import ProgressiveImage from "./ProgressiveImage";
import useModalAccessibility from "./useModalAccessibility";

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
    <li className="cart-line">
      <div className="cart-line-image">
        <ProgressiveImage
          src={item.imageUrl || FALLBACK_PRODUCT_IMAGE.url}
          alt={item.imageAlt || item.name}
          fill
          quality={75}
          placeholder="blur"
          blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
          sizes="72px"
          className="object-cover"
        />
      </div>
      <div className="cart-line-info">
        <div className="cart-line-top">
          <p className="cart-line-name">{item.name}</p>
          <button type="button" onClick={() => onRemove(item.id)} aria-label={`Eliminar ${item.name}`} className="cart-icon-button">
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
        <p className="cart-line-category">{item.category}</p>
        <div className="cart-line-bottom">
          <div className="cart-stepper">
            <button type="button" onClick={() => onDecrease(item.id, item.quantity)} aria-label={`Reducir ${item.name}`}>
              <Minus size={14} aria-hidden="true" />
            </button>
            <span>{item.quantity}</span>
            <button type="button" disabled={item.quantity >= Math.min(99, item.inventory ?? 99)} onClick={() => onIncrease(item.id, item.quantity)} aria-label={`Aumentar ${item.name}`}>
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
          <p className="cart-line-price">{formatDOP(item.price * item.quantity)}</p>
        </div>
      </div>
    </li>
  );
});

export default function CartDrawer({ floating = true }: { floating?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrderSubmission, setLastOrderSubmission] =
    useState<WhatsAppCheckoutSubmitResult | null>(null);

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

  const safeItems = hasMounted ? items : [];
  const safeIsOpen = hasMounted ? isOpen : false;
  const total = calculateCartTotal(safeItems);
  const totalItems = calculateCartCount(safeItems);
  useModalAccessibility(dialogRef, safeIsOpen, closeCart);

  useEffect(() => {
    if (!safeIsOpen) return;
    if (safeItems.length > 0) {
      setLastOrderSubmission(null);
    }
  }, [safeIsOpen, safeItems.length]);

  return (
    <>
      {floating ? <button
        type="button"
        onClick={openCart}
        aria-label={`Abrir pedido (${totalItems})`}
        aria-haspopup="dialog"
        aria-expanded={safeIsOpen}
        tabIndex={safeIsOpen ? -1 : 0}
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] shadow-[0_12px_28px_rgba(43,42,40,0.12)] transition duration-200 ease-editorial hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${
          safeIsOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>Pedido (<span className="inline-block min-w-[3ch] text-center tabular-nums">{totalItems}</span>)</span>
      </button> : null}

      <AnimatePresence initial={false}>
        {safeIsOpen ? (
          <motion.div
            key="cart"
            className="sheet-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            onClick={(event) => { if (event.target === event.currentTarget) closeCart(); }}
          >
          <motion.aside
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="sheet"
          >
            <header className="sheet-head">
              <h2 id="cart-title" className="sheet-heading">Tu pedido{totalItems ? ` (${totalItems})` : ""}</h2>
              <button type="button" onClick={closeCart} aria-label="Cerrar pedido" className="sheet-close">
                <X size={20} />
              </button>
            </header>

            <div className="sheet-body">
              {lastOrderSubmission?.ok ? (
                <div className="cart-done" role="status">
                  <p className="cart-done-title">Pedido {lastOrderSubmission.orderCode} listo</p>
                  <p>Falta un paso: envía el mensaje en WhatsApp para que una asesora lo confirme.</p>
                  <div className="cart-done-actions">
                    {lastOrderSubmission.whatsappUrl ? (
                      <a href={lastOrderSubmission.whatsappUrl} target="_blank" rel="noopener noreferrer" className="sheet-submit">
                        <MessageCircle size={16} aria-hidden="true" />Abrir WhatsApp
                      </a>
                    ) : null}
                    {lastOrderSubmission.signedIn && lastOrderSubmission.orderCode ? (
                      <Link href={`/mi-cuenta/pedidos/${encodeURIComponent(lastOrderSubmission.orderCode)}`} onClick={closeCart} className="cart-link">
                        Ver pedido en mi cuenta
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {safeItems.length === 0 ? (
                lastOrderSubmission?.ok ? null : (
                  <div className="cart-empty">
                    <p className="sheet-title">Tu pedido está vacío</p>
                    <p>Añade piezas desde la colección y envíanos tu pedido por WhatsApp cuando quieras.</p>
                    <Link href="/coleccion" onClick={closeCart} className="shop-button shop-button-primary">Explorar la colección</Link>
                  </div>
                )
              ) : (
                <ul className="cart-lines">
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

            {safeItems.length > 0 ? (
              <footer className="sheet-foot">
                <p className="sheet-total"><span>Total estimado</span><strong>{formatDOP(total)}</strong></p>
                <button type="button" onClick={() => setIsCheckoutOpen(true)} className="sheet-submit">
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </button>
                <p className="sheet-note">Después indicas tu dirección y envías el pedido por WhatsApp. Sin pagos en la web.</p>
                <button type="button" onClick={clearCart} className="cart-clear">Vaciar pedido</button>
              </footer>
            ) : null}
          </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <WhatsAppCheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={safeItems}
        source="cart"
        onSubmitted={(result) => {
          if (result.ok && result.persisted) {
            clearCart();
          }
          setLastOrderSubmission(result);
        }}
      />
    </>
  );
}
