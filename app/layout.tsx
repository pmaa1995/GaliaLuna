import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

const playfair = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Galia Luna",
  title: {
    default: "Galia Luna | Joyeria Fina",
    template: "%s | Galia Luna"
  },
  description:
    "Tienda online de joyeria fina con piezas minimalistas y checkout personalizado por WhatsApp."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const content = clerkEnabled ? (
    <ClerkProvider>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${playfair.variable} bg-[color:var(--bg-shell)] text-[color:var(--ink)] antialiased`}
      >
        {content}
      </body>
    </html>
  );
}
