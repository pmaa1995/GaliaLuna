import Link from "next/link";
import { memo } from "react";

import {
  FALLBACK_PRODUCT_IMAGE,
  PRODUCT_IMAGE_BLUR_DATA_URL,
  type Product,
} from "../../types/product";
import ProgressiveImage from "./ProgressiveImage";

interface HeroEditorialProps {
  activeCategoryLabel: string;
  visibleCount: number;
  featuredProduct?: Product;
  heroVideoSrc?: string;
  heroVideoPosterSrc?: string;
}

function HeroEditorialComponent({
  activeCategoryLabel,
  visibleCount,
  featuredProduct,
  heroVideoSrc,
  heroVideoPosterSrc,
}: HeroEditorialProps) {
  const image = featuredProduct?.images[0] ?? FALLBACK_PRODUCT_IMAGE;

  return (
    <section className="relative">
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
        <div className="relative order-2 lg:order-1 lg:col-span-5 lg:pt-14">
          <div className="relative z-20 max-w-[34rem]">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent via-[color:var(--accent-gold)] to-transparent" />
              <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--ink-soft)]">
                Colección 2026
              </p>
            </div>

            <h1 className="[font-family:var(--font-playfair)] text-[2.8rem] leading-[0.84] tracking-[-0.035em] text-[color:var(--ink)] sm:text-[3.6rem] lg:text-[5.6rem]">
              Joyería minimalista para momentos que perduran
            </h1>

            <p className="mt-5 max-w-[30ch] [font-family:var(--font-inter)] text-sm leading-6 text-[color:var(--ink-soft)] sm:text-[0.98rem]">
              Diseños delicados con acabado premium. Compra en línea y finaliza
              tu pedido por WhatsApp con atención personalizada.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="#coleccion"
                className="inline-flex items-center gap-3 [font-family:var(--font-inter)] text-sm text-[color:var(--ink)] transition duration-200 ease-editorial hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
              >
                <span>Explorar colección</span>
                <span className="h-px w-10 bg-[color:var(--ink)]/60" />
              </Link>

              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                {activeCategoryLabel}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                {visibleCount} piezas
              </p>
            </div>
          </div>
        </div>

        <div className="relative order-1 lg:order-2 lg:col-span-7">
          <figure className="relative overflow-hidden rounded-[26px] bg-[color:var(--bg-soft)]">
            <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[7/8]">
              {heroVideoSrc ? (
                <video
                  className="h-full w-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="metadata"
                  poster={heroVideoPosterSrc || image.url}
                >
                  <source src={heroVideoSrc} type="video/mp4" />
                </video>
              ) : (
                <ProgressiveImage
                  src={image.url}
                  alt={image.alt || "Pieza destacada de Galia Luna"}
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
                  sizes="(max-width: 768px) 92vw, (max-width: 1280px) 58vw, 54vw"
                  className="object-cover"
                />
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(246,241,233,0.24),transparent_42%),linear-gradient(180deg,rgba(43,42,40,0)_35%,rgba(43,42,40,0.28)_100%)]" />

              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                <div className="rounded-[18px] border border-[color:var(--paper)]/20 bg-[color:var(--ink)]/12 px-4 py-3 text-[color:var(--paper)] backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--paper)]/80">
                    Editorial pick
                  </p>
                  <p className="mt-1 [font-family:var(--font-playfair)] text-[1.1rem] leading-5 tracking-[-0.02em]">
                    {featuredProduct?.name ?? "Colección destacada"}
                  </p>
                </div>
                <p className="hidden [font-family:var(--font-inter)] text-xs text-[color:var(--paper)]/80 sm:block">
                  Campaña de estudio
                </p>
              </div>
            </div>
          </figure>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-[color:var(--accent-gold)]/0 via-[color:var(--accent-gold)] to-[color:var(--accent-gold)]/0" />
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Curaduría de campaña
              </p>
            </div>
            <p className="hidden [font-family:var(--font-inter)] text-xs text-[color:var(--ink-soft)] sm:block">
              Superficie visual: video o pieza fija
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const HeroEditorial = memo(HeroEditorialComponent);

export default HeroEditorial;
