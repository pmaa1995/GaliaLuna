import type { Metadata } from "next";
import CollectionPage from "../../components/store/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = await searchParams;
  return { title: "Colección de joyería y accesorios", description: "Descubre anillos, aretes, collares, cadenas y carteras de Galia Luna. Encuentra tu pieza y prepara tu pedido con atención personal.", alternates: { canonical: "/coleccion" }, ...(Object.keys(filters).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage searchParams={await searchParams} />;
}
