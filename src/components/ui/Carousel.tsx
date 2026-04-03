import { useState, useEffect, useRef, useCallback } from "react";
import { Lightbox } from "./Lightbox.tsx";

interface CarouselProps {
  images: string[];
  alt: string;
  autoPlayMs?: number;
}

export function isVideo(src: string) {
  return src.toLowerCase().endsWith(".mp4") || src.toLowerCase().endsWith(".webm");
}

function MediaItem({ src, alt, className, style }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties;
}) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={className}
        style={style}
        draggable={false}
      />
    );
  }
  return <img src={src} alt={alt} className={className} style={style} draggable={false} />;
}

function MuteButton({ muted, onToggle, size = "sm" }: { muted: boolean; onToggle: (e: React.MouseEvent) => void; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-6 h-6" : "w-5 h-5";
  return (
    <button
      onClick={onToggle}
      className="absolute bottom-2 right-2 z-20 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      aria-label={muted ? "Unmute" : "Mute"}
    >
      <img
        src={muted ? "/images/mute.svg" : "/images/unmute.svg"}
        alt={muted ? "Muted" : "Unmuted"}
        className={sz}
      />
    </button>
  );
}

export function Carousel({ images, alt, autoPlayMs = 3000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  // Pause background videos when lightbox opens, resume when it closes
  useEffect(() => {
    const videos = containerRef.current?.querySelectorAll<HTMLVideoElement>("video") ?? [];
    videos.forEach((v) => { lightboxOpen ? v.pause() : v.play().catch(() => {}); });
  }, [lightboxOpen]);

  // Play current video, pause+mute all others
  useEffect(() => {
    if (lightboxOpen) return;
    const videos = containerRef.current?.querySelectorAll<HTMLVideoElement>("video") ?? [];
    videos.forEach((v, i) => {
      if (i === current) {
        v.play().catch(() => {});
        // mute state controlled by user via button — don't touch
      } else {
        v.pause();
        v.muted = true;
      }
    });
    // Always reset mute state when navigating (even back to video)
    setMuted(true);
  }, [current, lightboxOpen]);

  useEffect(() => {
    if (total <= 1 || isHovered || lightboxOpen) return;
    const delay = isVideo(images[current]) ? 5000 : autoPlayMs;
    const id = setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [total, isHovered, lightboxOpen, next, autoPlayMs, current, images]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  if (total === 0) {
    return (
      <div className="aspect-square bg-surface-elevated flex items-center justify-center">
        <span className="text-text-muted text-sm">No image</span>
      </div>
    );
  }

  if (total === 1) {
    return (
      <>
        <div
          ref={containerRef}
          className="relative aspect-square overflow-hidden bg-surface-elevated cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          {isVideo(images[0]) ? (
            <video
              src={images[0]}
              autoPlay
              muted={muted}
              loop
              playsInline
              data-carousel-video
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <MediaItem src={images[0]} alt={alt} className="w-full h-full object-cover" />
          )}
          {isVideo(images[0]) && <MuteButton muted={muted} onToggle={toggleMute} />}
        </div>
        {lightboxOpen && (
          <Lightbox
            images={images} current={0} alt={alt}
            onClose={() => setLightboxOpen(false)}
            onPrev={prev} onNext={next}
            muted={muted} onToggleMute={() => setMuted((m) => !m)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="relative aspect-square overflow-hidden bg-surface-elevated group select-none cursor-zoom-in"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightboxOpen(true)}
        >
          {images.map((src, i) => (
            isVideo(src) ? (
              <video
                key={src}
                src={src}
                autoPlay
                muted={muted}
                loop
                playsInline
                data-carousel-video
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === current ? 1 : 0 }}
                draggable={false}
              />
            ) : (
              <MediaItem
                key={src}
                src={src}
                alt={`${alt} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === current ? 1 : 0 }}
              />
            )
          ))}

          {/* Mute button — only shown when current item is a video */}
          {isVideo(images[current]) && <MuteButton muted={muted} onToggle={toggleMute} />}

          {/* Progress bar */}
          {!isHovered && (
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-accent/60 transition-all duration-300 pointer-events-none"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          )}

          {/* Arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
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

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
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
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 bg-surface-card">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === current
                  ? "w-4 h-1.5 bg-accent"
                  : "w-1.5 h-1.5 bg-border hover:bg-text-muted"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images} current={current} alt={alt}
          onClose={() => setLightboxOpen(false)}
          onPrev={prev} onNext={next}
          muted={muted} onToggleMute={() => setMuted((m) => !m)}
        />
      )}
    </>
  );
}
