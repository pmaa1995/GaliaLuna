import type { MetadataRoute } from "next";
import { getActiveProductSlugs } from "../lib/catalogData";
import { collectionCategories } from "../lib/storefront";
import { SITE_URL } from "../lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getActiveProductSlugs();
  return ["/", "/coleccion", ...collectionCategories.map(({ slug }) => `/coleccion/${slug}`), "/envios", "/cambios-y-devoluciones", "/privacidad", "/terminos", ...slugs.map((slug) => "/product/" + encodeURIComponent(slug))]
    .map((pathname) => ({ url: SITE_URL + pathname }));
}
