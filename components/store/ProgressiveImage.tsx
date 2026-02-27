"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState, type SyntheticEvent } from "react";

type ProgressiveImageProps = ImageProps & {
  fallbackSrc?: string;
};

export default function ProgressiveImage({
  src,
  onError,
  onLoad,
  onLoadingComplete,
  fallbackSrc = "/images/product-placeholder.svg",
  ...imageProps
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFallback, setHasFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasFallback(false);
  }, [src]);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);

    if (!hasFallback) {
      const current = typeof currentSrc === "string" ? currentSrc : "";
      if (current !== fallbackSrc) {
        setHasFallback(true);
        setCurrentSrc(fallbackSrc);
        return;
      }
    }
  };

  return (
    <Image
      {...imageProps}
      src={currentSrc}
      onLoad={onLoad}
      onError={handleError}
      onLoadingComplete={onLoadingComplete}
    />
  );
}
