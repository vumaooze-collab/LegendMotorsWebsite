"use client";

import Image from "next/image";
import { useState } from "react";

export function VehicleImage({
  src,
  alt,
  sizes,
  className = "",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = !src || failedUrl === src;

  return (
    <div className={`vehicle-image vehicle-image--fill ${className}`}>
      {failed ? (
        <div className="vehicle-image__fallback" role="img" aria-label={`${alt}. Photograph unavailable.`}>
          <span aria-hidden="true">LM</span>
          <small>Photograph unavailable</small>
        </div>
      ) : (
        <Image
          alt={alt}
          fill
          onError={() => setFailedUrl(src)}
          sizes={sizes}
          src={src}
          unoptimized
        />
      )}
    </div>
  );
}
