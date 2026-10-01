import type { ReactNode } from "react";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import StoreCartRuntime from "./StoreCartRuntime";

export default function StoreShell({ children }: { children: ReactNode }) {
  return <div className="shop"><StoreHeader /><main id="contenido" tabIndex={-1}>{children}</main><StoreFooter /><StoreCartRuntime /></div>;
}
