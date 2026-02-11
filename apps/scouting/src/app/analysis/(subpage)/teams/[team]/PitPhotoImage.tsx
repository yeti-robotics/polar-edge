"use client";

import Image from "next/image";
import { useState } from "react";

interface PitPhotoImageProps {
  src: string;
  alt: string;
}

export function PitPhotoImage({ src, alt }: PitPhotoImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="flex h-[240px] w-[320px] items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
        role="img"
        aria-label={alt}
      >
        Photo unavailable
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={320}
      height={240}
      className="rounded-lg object-cover border border-border"
      sizes="(max-width: 640px) 100vw, 320px"
      onError={() => setError(true)}
      loading="eager"
    />
  );
}
