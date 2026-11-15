import { parseFormattedCode } from "../utils/colorSystem.ts";
import { PokzSilhouette } from "./PokzSilhouette.tsx";

/** Filmstrip thumbnail for a POKZ theme: the layered silhouette in this theme's colors. */
export function PokzThumb({ code }: { code: string }) {
  return <PokzSilhouette ids={parseFormattedCode(code)} className="w-full h-full" />;
}
