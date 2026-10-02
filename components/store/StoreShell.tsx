import type { ReactNode } from "react";
import { getHomePageData } from "../../lib/catalogData";
import { availableCategories } from "../../lib/storefront";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import StoreCartRuntime from "./StoreCartRuntime";

export default async function StoreShell({ children }: { children: ReactNode }) {
  const { activeProducts } = await getHomePageData();
  const categories = availableCategories(activeProducts);
  return <div className="shop"><StoreHeader categories={categories} /><main id="contenido" tabIndex={-1}>{children}</main><StoreFooter categories={categories} /><StoreCartRuntime /></div>;
}
