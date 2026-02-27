"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState, type SyntheticEvent } from "react";

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ProgressiveImageProps = ImageProps & {
  skeletonClassName?: string;
  fallbackSrc?: string;
  showSkeleton?: boolean;
};

export default function ProgressiveImage({
  src,
  className,
  style,
  onError,
  onLoadingComplete,
  skeletonClassName,
  fallbackSrc = "/images/product-placeholder.svg",
  showSkeleton = false,
  quality,
  ...imageProps
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFallback, setHasFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasFallback(false);
    setIsLoaded(false);
    const revealTimer = window.setTimeout(() => {
      setIsLoaded(true);
    }, 3000);
    return () => window.clearTimeout(revealTimer);
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

    setIsLoaded(true);
  };

  return (
    <>
      {showSkeleton ? (
        <span
          aria-hidden
          className={joinClasses(
            "pointer-events-none absolute inset-0 skeleton-shimmer transition-opacity duration-500",
            isLoaded ? "opacity-0" : "opacity-100",
            skeletonClassName,
          )}
        />
      ) : null}
      <Image
        {...imageProps}
        src={currentSrc}
        quality={quality}
        className={className}
        style={style}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        onLoadingComplete={(img) => {
          setIsLoaded(true);
          onLoadingComplete?.(img);
        }}
      />
    </>
  );
}
