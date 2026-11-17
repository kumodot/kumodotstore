import { parseFormattedCode } from "../utils/colorSystem.ts";
import { PokzSilhouette } from "./PokzSilhouette.tsx";

/** Filmstrip thumbnail for a POKZ theme: the layered silhouette in this theme's colors. */
/** `bare`: no dark backdrop of its own (the card behind it shows through). */
export function PokzThumb({ code, bare = false }: { code: string; bare?: boolean }) {
  return <PokzSilhouette ids={parseFormattedCode(code)} className="w-full h-full" bare={bare} />;
}
