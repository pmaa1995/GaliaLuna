"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MAX_ITEM_QUANTITY, MAX_ORDER_LINES, MAX_ORDER_QUANTITY, MAX_ORDER_TOTAL, isValidPrice, isValidProductId,
} from "../lib/orders/validation";
import { FALLBACK_PRODUCT_IMAGE, PRODUCT_CATEGORIES, type CartProductSnapshot } from "../types/product";

export interface CartItem extends CartProductSnapshot { quantity: number; }
interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: CartProductSnapshot, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
  getItemsCount: () => number;
}

function safeImage(value: unknown): string {
  if (typeof value !== "string" || value.length > 500) return FALLBACK_PRODUCT_IMAGE.url;
  if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname === "cdn.sanity.io" && !url.username && !url.password) return url.href;
  } catch { /* Invalid persisted URL. */ }
  return FALLBACK_PRODUCT_IMAGE.url;
}

/** Storage is untrusted and can contain stale, partial, or user-modified snapshots. */
export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, CartItem>();
  let totalQuantity = 0;
  let totalCents = 0;
  for (const raw of value.slice(0, MAX_ORDER_LINES)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    if (!isValidProductId(item.id) || !isValidPrice(item.price) ||
        typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY ||
        typeof item.name !== "string" || !item.name.trim() || item.name.length > 180 ||
        item.currency !== "DOP" || !PRODUCT_CATEGORIES.includes(item.category as CartItem["category"])) continue;
    if (item.inventory != null && (typeof item.inventory !== "number" ||
        !Number.isSafeInteger(item.inventory) || item.inventory < 0)) continue;
    const existing = result.get(item.id);
    const maxQuantity = Math.min(MAX_ITEM_QUANTITY,
      typeof item.inventory === "number" ? item.inventory : MAX_ITEM_QUANTITY,
      typeof existing?.inventory === "number" ? existing.inventory : MAX_ITEM_QUANTITY);
    const quantity = Math.min(item.quantity, Math.max(0, maxQuantity - (existing?.quantity ?? 0)));
    const extraCents = Math.round((existing?.price ?? item.price) * 100) * quantity;
    if (!quantity || totalQuantity + quantity > MAX_ORDER_QUANTITY ||
        totalCents + extraCents > MAX_ORDER_TOTAL * 100) continue;
    totalQuantity += quantity;
    totalCents += extraCents;
    result.set(item.id, existing ? { ...existing, quantity: existing.quantity + quantity } : {
      id: item.id, name: item.name.trim(), category: item.category as CartItem["category"],
      price: item.price, currency: "DOP", imageUrl: safeImage(item.imageUrl),
      inventory: typeof item.inventory === "number" ? item.inventory : null,
      imageAlt: typeof item.imageAlt === "string" ? item.imageAlt.slice(0, 180) : item.name.trim(),
      quantity,
    });
  }
  return Array.from(result.values());
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
}
export function calculateCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [], isOpen: false,
      addItem: (product, quantity = 1) => set((state) => {
        if (!Number.isSafeInteger(quantity) || quantity < 1) return state;
        const [safeProduct] = sanitizeCartItems([{ ...product, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }]);
        if (!safeProduct) return state;
        const existing = state.items.find((item) => item.id === product.id);
        const nextItems = existing
          ? state.items.map((item) => item.id === product.id
            ? { ...safeProduct, quantity: Math.min(MAX_ITEM_QUANTITY, safeProduct.inventory ?? MAX_ITEM_QUANTITY, item.quantity + safeProduct.quantity) } : item)
          : [...state.items, safeProduct];
        if (nextItems.length > MAX_ORDER_LINES || calculateCartCount(nextItems) > MAX_ORDER_QUANTITY ||
            calculateCartTotal(nextItems) > MAX_ORDER_TOTAL) return state;
        return { items: nextItems, isOpen: true };
      }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      setQuantity: (productId, quantity) => set((state) => {
        if (!Number.isSafeInteger(quantity)) return state;
        if (quantity <= 0) return { items: state.items.filter((item) => item.id !== productId) };
        const nextItems = state.items.map((item) => item.id === productId
          ? { ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY, item.inventory ?? MAX_ITEM_QUANTITY) } : item);
        if (calculateCartCount(nextItems) > MAX_ORDER_QUANTITY || calculateCartTotal(nextItems) > MAX_ORDER_TOTAL) return state;
        return { items: nextItems };
      }),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      getTotal: () => calculateCartTotal(get().items),
      getItemsCount: () => calculateCartCount(get().items),
    }),
    {
      name: "galia-luna-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeCartItems(persisted && typeof persisted === "object"
          ? (persisted as { items?: unknown }).items : undefined),
      }),
    },
  ),
);
