import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPage from "../../../components/store/CollectionPage";
import { categoryFromSlug } from "../../../lib/storefront";

type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).categoria);
  if (!category) return { title: "Colección no encontrada", robots: { index: false } };
  return { title: category.label, description: category.description, alternates: { canonical: `/coleccion/${category.slug}` }, ...(Object.keys(await searchParams).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function Page({ params, searchParams }: Props) {
  const category = categoryFromSlug((await params).categoria);
  if (!category) notFound();
  return <CollectionPage category={category} searchParams={await searchParams} />;
}
