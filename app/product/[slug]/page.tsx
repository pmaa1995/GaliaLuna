import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CartDrawer from "../../../components/store/CartDrawer";
import ProductDetailView from "../../../components/store/ProductDetailView";
import { getActiveProductSlugs, getProductPageData } from "../../../lib/catalogData";
import { productUrl, productSchema, serializeJsonLd } from "../../../lib/seo";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductPageData(slug);
  const product = data?.product;

  if (!product) {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: product.name,
    alternates: { canonical: productUrl(product) },
    description: `${product.description} · ${product.category} · Compra por WhatsApp en Galia Luna.`,
    openGraph: {
      title: `${product.name} | Galia Luna`,
      description: product.description,
      type: "website",
      url: productUrl(product),
      locale: "es_DO",
      siteName: "Galia Luna",
      images: product.images.map(({ url, alt, width, height }) => ({ url, alt, width, height })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", ...productSchema(data.product) }) }} />
      <ProductDetailView
        product={data.product}
        relatedProducts={data.relatedProducts}
      />
      <CartDrawer />
    </main>
  );
}

