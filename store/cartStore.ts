"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartProductSnapshot } from "../types/product";

export interface CartItem extends CartProductSnapshot {
  quantity: number;
}

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

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) =>
        set((state) => {
          const qty = normalizeQuantity(quantity);
          const existing = state.items.find((item) => item.id === product.id);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + qty }
                  : item,
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { ...product, quantity: qty }],
            isOpen: true,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => {
          const qty = Math.floor(quantity);

          if (qty <= 0) {
            return {
              items: state.items.filter((item) => item.id !== productId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === productId ? { ...item, quantity: qty } : item,
            ),
          };
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
    },
  ),
);

