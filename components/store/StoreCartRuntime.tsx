"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false, loading: () => <p role="status" className="shop-cart-loading">Abriendo tu pedido…</p> });

export default function StoreCartRuntime() {
  const isOpen = useCartStore((state) => state.isOpen);
  const [activated, setActivated] = useState(false);
  useEffect(() => { if (isOpen) setActivated(true); }, [isOpen]);
  // Keep the module mounted after first use, preserving confirmation and modal focus.
  return activated || isOpen ? <CartDrawer floating={false} /> : null;
}
