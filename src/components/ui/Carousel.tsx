import { useState, useEffect, useRef, useCallback } from "react";

interface CarouselProps {
  images: string[];
  alt: string;
  autoPlayMs?: number;
}

export function Carousel({ images, alt, autoPlayMs = 3000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + total) % total), [total]);

  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % total), [total]);

  // Auto-play
  useEffect(() => {
    if (total <= 1 || isHovered) return;
    const id = setInterval(next, autoPlayMs);
    return () => clearInterval(id);
  }, [total, isHovered, next, autoPlayMs]);

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (total === 0) {
    return (
      <div className="aspect-square bg-surface-elevated flex items-center justify-center">
        <span className="text-text-muted text-sm">No image</span>
      </div>
    );
  }

  // Single image — no controls needed
  if (total === 1) {
    return (
      <div className="aspect-square overflow-hidden bg-surface-elevated">
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square overflow-hidden bg-surface-elevated group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Images */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0 }}
          draggable={false}
        />
      ))}

      {/* Left arrow */}
      <button
        onClick={(e) => { e.preventDefault(); prev(); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-black/50 text-white
                   flex items-center justify-center
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-200
                   hover:bg-black/75 cursor-pointer"
        aria-label="Previous"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={(e) => { e.preventDefault(); next(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-black/50 text-white
                   flex items-center justify-center
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-200
                   hover:bg-black/75 cursor-pointer"
        aria-label="Next"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 2l5 5-5 5" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); setCurrent(i); }}
            className={`rounded-full transition-all duration-300 cursor-pointer
              ${i === current
                ? "w-4 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/75"
              }`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-accent/60 transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      )}
    </div>
  );
}
