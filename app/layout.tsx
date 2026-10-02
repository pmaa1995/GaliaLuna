import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { SITE_URL } from "../lib/seo";
import "./globals.css";
import "./storefront.css";
import "./account.css";

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
  metadataBase: new URL(SITE_URL),
  applicationName: "Galia Luna",
  title: {
    default: "Galia Luna | Joyería fina",
    template: "%s | Galia Luna",
  },
  description:
    "Tienda online de joyería artesanal con piezas hechas a mano y compra guiada por WhatsApp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${playfair.variable} bg-[color:var(--bg-shell)] text-[color:var(--ink)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
