import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CollectionCategory } from "../../lib/storefront";
import { WHATSAPP_OWNER_NUMBER, WHATSAPP_PHONE_DISPLAY } from "../../lib/contact";

export default function StoreFooter({ categories }: { categories: CollectionCategory[] }) {
  return <footer className="shop-footer" id="contacto">
    <div className="shop-footer-grid shop-container">
      <div className="shop-footer-brand"><Link href="/" className="shop-footer-logo">Galia Luna</Link><p>Detalles que hablan de ti.</p><p>Joyería y accesorios, con atención personal para ayudarte a elegir.</p></div>
      <div><h2>Explorar</h2><Link href="/coleccion">Toda la colección</Link>{categories.map(({ slug, label }) => <Link key={slug} href={`/coleccion/${slug}`}>{label}</Link>)}</div>
      <div><h2>Tu compra</h2><Link href="/mi-cuenta">Mi cuenta y pedidos</Link><Link href="/envios">Envíos y entregas</Link><Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link><Link href="/#como-comprar">Cómo comprar</Link></div>
      <div><h2>Estamos para ti</h2><p>Te ayudamos con tu elección y coordinamos tu pedido por WhatsApp.</p><a className="shop-footer-contact" href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`} target="_blank" rel="noopener noreferrer">Escríbenos <ArrowUpRight size={16} /></a><span>{WHATSAPP_PHONE_DISPLAY}</span></div>
    </div>
    <div className="shop-footer-bottom shop-container"><span>© {new Date().getFullYear()} Galia Luna · República Dominicana</span><div><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><span>Precios en RD$</span></div></div>
  </footer>;
}
