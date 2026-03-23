import { useEffect, useCallback } from "react";

interface LightboxProps {
  images: string[];
  current: number;
  alt: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ images, current, alt, onClose, onPrev, onNext }: LightboxProps) {
  const total = images.length;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "ArrowRight") onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    // Backdrop — click outside closes
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel — click inside does NOT close */}
      <div
        className="relative bg-surface-card border border-border rounded-2xl shadow-2xl
                   w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50
                     hover:bg-black/70 text-white flex items-center justify-center
                     transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square bg-surface-elevated overflow-hidden">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${alt} ${i + 1}`}
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
              style={{ opacity: i === current ? 1 : 0 }}
              draggable={false}
            />
          ))}

          {/* Prev arrow */}
          {total > 1 && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                         bg-black/50 hover:bg-black/70 text-white flex items-center
                         justify-center transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {total > 1 && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                         bg-black/50 hover:bg-black/70 text-white flex items-center
                         justify-center transition-colors cursor-pointer"
              aria-label="Next"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 2l5 5-5 5" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2 py-3">
            {images.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-4 h-1.5 bg-accent"
                    : "w-1.5 h-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
