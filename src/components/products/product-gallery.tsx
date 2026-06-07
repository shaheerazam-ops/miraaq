"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const displayImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative aspect-[3/4] rounded-lg overflow-hidden bg-obsidian-800 cursor-zoom-in",
          zoomed && "cursor-zoom-out"
        )}
        onClick={() => setZoomed(!zoomed)}
      >
        <Image
          src={displayImages[selected]}
          alt={`${name} - image ${selected + 1}`}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            zoomed && "scale-150"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-obsidian-950/60 flex items-center justify-center">
          <ZoomIn className="h-4 w-4 text-ivory-100" />
        </div>
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => { setSelected(i); setZoomed(false); }}
              className={cn(
                "relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors",
                selected === i ? "border-gold-500" : "border-transparent hover:border-obsidian-600"
              )}
            >
              <Image src={img} alt={`${name} thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-obsidian-500 text-center">
        Click image to zoom · 360° view available on select products
      </p>
    </div>
  );
}
