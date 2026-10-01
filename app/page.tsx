import type { Metadata } from "next";

import StoreShell from "../components/store/StoreShell";
import HomeEditorial from "../components/store/HomeEditorial";
import { getHomePageData } from "../lib/catalogData";
import { SITE_URL, productSchema, serializeJsonLd } from "../lib/seo";

const SITE_TITLE = "Galia Luna | Joyería Fina";
const SITE_DESCRIPTION =
  "Tienda online de Galia Luna con joyería artesanal, piezas hechas a mano y atención personalizada por WhatsApp.";

const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
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
    url: SITE_URL,
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

export async function generateMetadata(): Promise<Metadata> {
  const { activeProducts, homeShowcase } = await getHomePageData();
  const image = (homeShowcase.featuredProduct ?? activeProducts[0])?.images[0];
  if (!image) return metadata;
  return {
    ...metadata,
    openGraph: {
      title: SITE_TITLE, description: SITE_DESCRIPTION, type: "website",
      url: SITE_URL, locale: "es_DO", siteName: "Galia Luna",
      images: [{ url: image.url, alt: image.alt, width: image.width, height: image.height }],
    },
    twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [image.url] },
  };
}

export const revalidate = 3600;
const HOME_SCHEMA_PRODUCT_LIMIT = 24;

export default async function HomePage() {
  const { activeProducts, homeShowcase } = await getHomePageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "OnlineStore", "@id": SITE_URL + "#store", name: "Galia Luna", url: SITE_URL, description: SITE_DESCRIPTION },
      {
        "@type": "ItemList",
        itemListElement: activeProducts.slice(0, HOME_SCHEMA_PRODUCT_LIMIT).map((product, index) => ({
          "@type": "ListItem", position: index + 1, item: productSchema(product),
        })),
      },
    ],
  };

  return (
    <StoreShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HomeEditorial
        products={activeProducts}
        heroProducts={homeShowcase.heroProducts}
        featuredProduct={homeShowcase.featuredProduct}
      />
    </StoreShell>
  );
}
