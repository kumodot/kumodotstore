import { useEffect, useState } from "react";

// Firmware logos: one-color SVGs in public/logos. Each is loaded once; its real drawing (not the empty margin
// of the SVG) is found by scanning the alpha, so any viewBox fits the strip the same way.
export interface Logo { img: HTMLImageElement; w: number; h: number; box: { x: number; y: number; w: number; h: number } }

/** Empty border left around a logo in its strip (fraction of the strip). Small: the logo fills the strip up to the bezel hole. */
export const LOGO_MARGIN = 0.03;

const cache = new Map<string, Promise<Logo | null>>();

export function loadLogo(file: string): Promise<Logo | null> {
  let p = cache.get(file);
  if (!p) {
    p = new Promise<Logo | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 512, h = img.naturalHeight || 512;
        const k = 512 / Math.max(w, h);   // scan at a fixed size
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(h * k));
        const x = c.getContext("2d")!;
        x.drawImage(img, 0, 0, c.width, c.height);
        const d = x.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
        for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {
          if (d[(yy * c.width + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
        }
        if (x1 <= x0 || y1 <= y0) return resolve({ img, w, h, box: { x: 0, y: 0, w, h } });
        resolve({ img, w, h, box: { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k } });
      };
      img.onerror = () => resolve(null);
      img.src = `${import.meta.env.BASE_URL}logos/${file}`;
    });
    cache.set(file, p);
  }
  return p;
}

/** The logo for a React component (null while it loads, or when there is none). */
export function useLogo(file: string | null): Logo | null {
  const [logo, setLogo] = useState<Logo | null>(null);
  useEffect(() => {
    let dead = false;
    setLogo(null);
    if (file) loadLogo(file).then((l) => { if (!dead) setLogo(l); });
    return () => { dead = true; };
  }, [file]);
  return logo;
}

/** Where the logo's drawing lands (image x, y, width, height) when it is fitted, centered, in a target rectangle. */
export function fitLogo(l: Logo, tx: number, ty: number, tw: number, th: number, margin = LOGO_MARGIN) {
  const aw = tw * (1 - 2 * margin), ah = th * (1 - 2 * margin);
  const s = Math.min(aw / l.box.w, ah / l.box.h);
  return { x: tx + (tw - l.box.w * s) / 2 - l.box.x * s, y: ty + (th - l.box.h * s) / 2 - l.box.y * s, w: l.w * s, h: l.h * s };
}

/** The logo painted in one color on a transparent canvas (for the 3D strip). */
export function logoCanvas(l: Logo, width: number, height: number, color: string, margin = LOGO_MARGIN) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d")!;
  const f = fitLogo(l, 0, 0, width, height, margin);
  x.drawImage(l.img, f.x, f.y, f.w, f.h);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = color;
  x.fillRect(0, 0, width, height);
  return c;
}
