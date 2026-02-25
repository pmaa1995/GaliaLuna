import type { Metadata } from "next";

import CartDrawer from "../components/store/CartDrawer";
import ProductGrid from "../components/store/ProductGrid";
import {
  catalogProducts,
  getActiveProducts,
  getResolvedHomeShowcase,
} from "../lib/catalog";

const SITE_TITLE = "Galia Luna | Joyería Fina";
const SITE_DESCRIPTION =
  "Tienda online de Galia Luna con joyería artesanal, piezas hechas a mano y atención personalizada por WhatsApp.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "joyería fina",
    "anillos",
    "aretes",
    "collares",
    "cadenas",
    "carteras",
    "Galia Luna",
    "República Dominicana",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "es_DO",
    siteName: "Galia Luna",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const revalidate = 3600;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Galia Luna",
  description: SITE_DESCRIPTION,
  itemListElement: catalogProducts.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: product.name,
      category: product.category,
      description: product.description,
      sku: product._id,
      offers: {
        "@type": "Offer",
        priceCurrency: product.currency,
        price: product.price,
        availability: "https://schema.org/InStock",
      },
    },
  })),
};

export default function HomePage() {
  const activeProducts = getActiveProducts();
  const homeShowcase = getResolvedHomeShowcase(activeProducts);

  return (
    <main className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductGrid
        products={activeProducts}
        heroProducts={homeShowcase.heroProducts}
        featuredProduct={homeShowcase.featuredProduct}
      />
      <CartDrawer />
    </main>
  );
}

