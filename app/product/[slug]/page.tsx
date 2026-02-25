import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CartDrawer from "../../../components/store/CartDrawer";
import ProductDetailView from "../../../components/store/ProductDetailView";
import { getActiveProductSlugs, getProductPageData } from "../../../lib/catalogData";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const data = await getProductPageData(params.slug);
  const product = data?.product;

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

export default async function ProductPage({ params }: ProductPageProps) {
  const data = await getProductPageData(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="relative min-h-screen">
      <ProductDetailView
        product={data.product}
        relatedProducts={data.relatedProducts}
      />
      <CartDrawer />
    </main>
  );
}

