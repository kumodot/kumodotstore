import type { CSSProperties } from "react";

/** How a color is drawn as a swatch: solid, or diagonal stripes over a faded fill when it is translucent. */
export function swatchStyle(c: { hex: string; translucent?: boolean }): CSSProperties {
  if (!c.translucent) return { background: c.hex };
  return {
    background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0 3px, transparent 3px 7px), linear-gradient(${c.hex}b8, ${c.hex}b8), #2a2a28`,
  };
}
