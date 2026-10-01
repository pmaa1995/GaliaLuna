"use client";

import type { ImageLoaderProps } from "next/image";

const fallback = "/images/product-placeholder.svg";

/** Let the existing Sanity CDN resize once, instead of re-encoding in the Worker. */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith("/images/")) return src;
  let image: URL;
  try { image = new URL(src); } catch { return fallback; }
  if (image.protocol !== "https:" || image.hostname !== "cdn.sanity.io" ||
      image.port || image.username || image.password || !image.pathname.startsWith("/images/")) return fallback;
  const pixels = Number.isFinite(width) ? Math.min(2400, Math.max(1, Math.round(width))) : 1200;
  const compression = typeof quality === "number" && Number.isFinite(quality) ? Math.min(90, Math.max(1, Math.round(quality))) : 75;
  image.searchParams.set("w", String(pixels));
  image.searchParams.set("q", String(compression));
  image.searchParams.set("auto", "format");
  image.searchParams.set("fit", "max");
  image.hash = "";
  return image.toString();
}
