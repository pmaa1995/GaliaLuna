import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { preconnect } from "react-dom";

import { clerkLocalization } from "../../lib/clerkLocalization";

// Clerk (~1 MB of client JS) is mounted only on account routes; the storefront loads it on demand at checkout.
export default function AuthProvider({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return children;
  const frontendApi = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API;
  if (frontendApi) preconnect(`https://${frontendApi}`, { crossOrigin: "anonymous" });
  return <ClerkProvider localization={clerkLocalization}>{children}</ClerkProvider>;
}
