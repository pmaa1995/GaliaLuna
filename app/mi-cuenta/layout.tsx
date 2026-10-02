import type { Metadata } from "next";

// Account availability and user data depend on runtime secrets and the current session.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
