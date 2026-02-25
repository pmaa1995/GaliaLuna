import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CartDrawer from "../../../components/store/CartDrawer";
import ProductDetailView from "../../../components/store/ProductDetailView";
import {
  catalogProducts,
  getProductBySlug,
  getRelatedProducts,
} from "../../../lib/catalog";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return catalogProducts
    .filter((product) => product.isActive)
    .map((product) => ({ slug: product.slug.current }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Producto no encontrado | Galia Luna",
    };
  }

  return {
    title: `${product.name} | Galia Luna`,
    description: `${product.description} · ${product.category} · Compra por WhatsApp en Galia Luna.`,
    openGraph: {
      title: `${product.name} | Galia Luna`,
      description: product.description,
      type: "website",
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const related = getRelatedProducts(product, 4);

  return (
    <main className="relative min-h-screen">
      <ProductDetailView product={product} relatedProducts={related} />
      <CartDrawer />
    </main>
  );
}

