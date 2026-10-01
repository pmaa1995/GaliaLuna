import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/mi-cuenta", "/api/", "/iniciar-sesion", "/registrarse", "/whatsapp-bridge.html"] },
    sitemap: SITE_URL + "/sitemap.xml",
  };
}
