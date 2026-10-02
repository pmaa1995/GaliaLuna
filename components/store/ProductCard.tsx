"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { memo } from "react";
import { useCartStore } from "../../store/cartStore";
import { FALLBACK_PRODUCT_IMAGE, PRODUCT_IMAGE_BLUR_DATA_URL, formatDOP, toCartProductSnapshot, type Product } from "../../types/product";
import ProgressiveImage from "./ProgressiveImage";

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
  onAddToCart?: (product: Product) => void;
  variant?: "feature" | "tall" | "standard";
}

function ProductCard({ product, priority = false, onAddToCart }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const image = product.images[0] ?? FALLBACK_PRODUCT_IMAGE;
  const soldOut = typeof product.inventory === "number" && (!Number.isSafeInteger(product.inventory) || product.inventory <= 0);
  const href = `/product/${encodeURIComponent(product.slug.current)}`;
  const add = () => {
    if (onAddToCart) onAddToCart(product);
    else { addItem(toCartProductSnapshot(product), 1); openCart(); }
  };
  return <article className="shop-product-card" data-product-price={product.price}>
    <div className="shop-product-media">
      <Link href={href} className="shop-product-image" aria-label={`Ver ${product.name}`}>
        <ProgressiveImage src={image.url} alt={image.alt || product.name} fill priority={priority} quality={75} sizes="(max-width: 639px) calc(50vw - 24px), (max-width: 1023px) calc(33vw - 24px), (max-width: 1519px) calc(25vw - 32px), 340px" placeholder="blur" blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL} />
        {(soldOut || product.badge) && <span className="shop-product-badge">{soldOut ? "Agotado" : product.badge}</span>}
      </Link>
      {!soldOut && <button type="button" className="shop-product-add" onClick={add} aria-label={`Añadir ${product.name} al pedido`} title="Añadir al pedido"><Plus size={18} aria-hidden="true" /></button>}
    </div>
    <div className="shop-product-info"><p className="shop-product-category">{product.category}</p><h3><Link href={href}>{product.name}</Link></h3><p className="shop-product-price">{formatDOP(product.price)}</p></div>
  </article>;
}

export default memo(ProductCard);
