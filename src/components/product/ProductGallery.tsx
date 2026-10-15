import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <div className="glass relative aspect-square overflow-hidden rounded-3xl">
        <img src={images[active]} alt={alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                i === active ? "border-gold-400" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
