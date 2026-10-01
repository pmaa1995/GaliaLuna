"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type SyntheticEvent } from "react";

type ProgressiveImageProps = ImageProps & {
  fallbackSrc?: string;
};

export default function ProgressiveImage({
  src,
  alt,
  onError,
  onLoad,
  onLoadingComplete,
  fallbackSrc = "/images/product-placeholder.svg",
  ...imageProps
}: ProgressiveImageProps) {
  // Bind failures to the original source, so changing a gallery image never paints
  // the previous source for one render or resets a new error in an effect.
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  const currentSrc = failedSource === src ? fallbackSrc : src;

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);

    if (currentSrc !== fallbackSrc) setFailedSource(src);
  };

  return (
    <Image
      {...imageProps}
      src={currentSrc}
      alt={alt}
      onLoad={onLoad}
      onError={handleError}
      onLoadingComplete={onLoadingComplete}
    />
  );
}
