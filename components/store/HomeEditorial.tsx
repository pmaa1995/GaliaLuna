import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, MessageCircle, PackageCheck, ShoppingBag } from "lucide-react";
import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { collectionCategories, selectHomeProducts } from "../../lib/storefront";
import { FALLBACK_PRODUCT_IMAGE, PRODUCT_IMAGE_BLUR_DATA_URL, formatDOP, type Product } from "../../types/product";
import ProgressiveImage from "./ProgressiveImage";
import OrderReceipt from "./OrderReceipt";
import ProductCard from "./ProductCard";

interface HomeEditorialProps { products: Product[]; heroProducts?: Product[]; featuredProduct?: Product; }

export default function HomeEditorial({ products, heroProducts, featuredProduct }: HomeEditorialProps) {
  const hero = featuredProduct ?? heroProducts?.[0] ?? products[0];
  const image = hero?.images[0] ?? FALLBACK_PRODUCT_IMAGE;
  const selection = selectHomeProducts(products, hero?._id);
  const categories = collectionCategories.map((category) => ({ ...category, products: products.filter((product) => product.category === category.label) })).filter((category) => category.products.length > 0);
  return <>
    <Suspense fallback={null}><OrderReceipt /></Suspense>
    <section className="shop-hero" aria-labelledby="hero-title">
      <div className="shop-hero-copy"><p className="shop-eyebrow">EL UNIVERSO GALIA LUNA</p><h1 id="hero-title">Lo especial está<br />en los detalles.</h1><p>Joyas y accesorios con personalidad.<br />Encuentra esa pieza que se siente tuya.</p><Link href="/coleccion" className="shop-button shop-button-primary">Explorar la colección <ArrowRight size={17} /></Link><span className="shop-hero-note">{products.length > 0 && <>{products.length} {products.length === 1 ? "pieza para descubrir" : "piezas para descubrir"}. </>}Te acompañamos al comprar.</span></div>
      <div className="shop-hero-media">
        <ProgressiveImage src={image.url} alt={image.alt || hero?.name || "Galia Luna"} fill priority fetchPriority="high" quality={80} sizes="(max-width: 767px) 100vw, 55vw" placeholder="blur" blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL} />
        {hero && <Link className="shop-hero-caption" href={`/product/${encodeURIComponent(hero.slug.current)}`}><span><small>EN ESTA SELECCIÓN</small>{hero.name}<small>{formatDOP(hero.price)}</small></span><ArrowUpRight size={23} aria-hidden="true" /></Link>}
      </div>
    </section>

    <section className="shop-section shop-container" id="colecciones" aria-labelledby="categories-title">
      <div className="shop-section-heading"><div><p className="shop-eyebrow">A TU MANERA</p><h2 id="categories-title">Encuentra tu pieza.</h2></div></div>
      <div className="shop-category-grid" style={{ "--category-count": Math.max(categories.length, 1) } as CSSProperties}>{categories.map((category) => {
        const photo = category.products[0]?.images[0];
        return <Link href={`/coleccion/${category.slug}`} key={category.slug} className="shop-category-tile"><div className="shop-category-photo">{photo ? <ProgressiveImage src={photo.url} alt="" fill quality={70} sizes="(max-width: 767px) 40vw, 25vw" /> : <span className="shop-category-monogram" aria-hidden="true">GL</span>}</div><div><h3>{category.label}</h3><ArrowUpRight size={17} aria-hidden="true" /></div><span>{category.products.length} {category.products.length === 1 ? "pieza" : "piezas"}</span></Link>;
      })}</div>
    </section>

    <section className="shop-selection" id="catalogo" aria-labelledby="selection-title"><div className="shop-container shop-section">
      <div className="shop-section-heading"><div><p className="shop-eyebrow">PARA DESCUBRIR</p><h2 id="selection-title">La selección de Galia Luna.</h2></div></div>
      {selection.length ? <div className="shop-product-grid">{selection.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <p className="shop-empty">Estamos preparando nuestra selección. Vuelve pronto para descubrir las piezas.</p>}
      {products.length > selection.length && <div className="shop-selection-more"><p>Esto es solo una selección. Descubre las {products.length} piezas de la colección.</p><Link href="/coleccion" className="shop-button shop-button-primary">Ver colección completa <ArrowRight size={17} /></Link></div>}
    </div></section>

    <section className="shop-service-story shop-container" id="como-comprar" aria-labelledby="service-title">
      <div className="shop-service-intro"><p className="shop-eyebrow">CERCA DE TI, EN CADA PASO</p><h2 id="service-title">Tu estilo.<br />Nuestra atención.</h2><p>Una compra con atención personal, desde la primera pregunta hasta coordinar tu entrega.</p><a className="shop-button shop-button-secondary" href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent("Hola Galia Luna, me gustaría recibir asesoría para elegir una pieza.")}`} target="_blank" rel="noopener noreferrer">Hablar con una asesora <ArrowUpRight size={17} /></a></div>
      <ol className="shop-buy-steps"><li><ShoppingBag size={23} strokeWidth={1.3} /><div><span>01 / ELIGE</span><h3>Encuentra tus favoritas</h3><p>Explora la colección y añade las piezas a tu pedido.</p></div></li><li><MessageCircle size={23} strokeWidth={1.3} /><div><span>02 / CONVERSAMOS</span><h3>Confirma por WhatsApp</h3><p>Completa tus datos y envía el pedido. Revisamos contigo la disponibilidad y el pago.</p></div></li><li><PackageCheck size={23} strokeWidth={1.3} /><div><span>03 / COORDINAMOS</span><h3>Acordamos tu entrega</h3><p>Confirmamos contigo el envío, su costo y el tiempo estimado. <Link href="/envios">Información de entregas</Link></p></div></li></ol>
    </section>
  </>;
}
