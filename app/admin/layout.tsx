import type { Metadata } from "next";

import AuthProvider from "../../components/auth/AuthProvider";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
