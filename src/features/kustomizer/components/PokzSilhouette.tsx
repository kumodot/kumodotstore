import { useId } from "react";
import { getRgbStyle, isTranslucent } from "../utils/colorSystem.ts";

// Layered top view of the Pocket Operator inside the POKZ case, dark version.
// Measured from gallery_Icon.png (613 x 1098) by pixel: pads, case body, screen window and
// module are exact boxes, the handle hole and the knob are by eye. Every layer is a named
// group (handle, case, screen, module, keys-top, keys-side, pads) so one can be swapped for a
// traced path later. Only the 16 pads take theme colors, the rest stays in the dark palette.
const COLS = [94, 180, 264, 349];
const ROWS = [586, 683, 780, 876];
const PAD_W = 69;
const PAD_H = 78;

export function PokzSilhouette({ ids, className, bare = false }: { ids: string[]; className?: string; bare?: boolean }) {
  const stripes = useId();
  return (
    <svg viewBox="0 0 613 1098" className={className} role="img" aria-label="POKZ case top view">
      {!bare && <rect width="613" height="1098" fill="#0D0D0C" />}

      <g id="handle">
        <rect x="128" y="28" width="343" height="131" rx="64" fill="#2A2926" />
        <rect x="170" y="72" width="259" height="46" rx="23" fill={bare ? "none" : "#0D0D0C"} />
      </g>

      <g id="case">
        <rect x="45" y="160" width="508" height="877" rx="14" fill="#1D1C1A" stroke="#3B3A36" strokeWidth="4" />
        <rect x="57" y="169" width="484" height="857" rx="8" fill="#151514" />
      </g>

      <g id="screen">
        <rect x="62" y="261" width="475" height="214" fill="#2A2926" />
        <rect x="85" y="282" width="430" height="172" fill="#0D0D0C" />
        <rect x="102" y="288" width="397" height="161" fill="#050505" />
      </g>

      <g id="module">
        <rect x="332" y="475" width="205" height="104" fill="#2A2926" />
        <circle cx="400" cy="527" r="26" fill="#3B3A36" />
        <circle cx="470" cy="527" r="30" fill="#3B3A36" />
      </g>

      <g id="keys-top" fill="#3B3A36">
        <rect x="101" y="515" width="54" height="32" />
        <rect x="189" y="515" width="49" height="31" />
        <rect x="274" y="515" width="53" height="31" />
      </g>

      <g id="keys-side" fill="#3B3A36">
        <rect x="447" y="612" width="49" height="30" />
        <rect x="447" y="708" width="49" height="32" />
        <rect x="447" y="790" width="49" height="52" />
        <rect x="447" y="905" width="49" height="30" />
      </g>

      <defs>
        {/* translucent filament: diagonal stripes, same look as the swatches */}
        <pattern id={stripes} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="14" fill="#fff" fillOpacity=".55" />
        </pattern>
      </defs>
      <g id="pads">
        {ids.slice(0, 16).map((id, i) => {
          const x = COLS[i % 4], y = ROWS[Math.floor(i / 4)];
          return (
            <g key={i}>
              <rect x={x} y={y} width={PAD_W} height={PAD_H} fill={getRgbStyle(id)} fillOpacity={isTranslucent(id) ? 0.72 : 1} />
              {isTranslucent(id) && <rect x={x} y={y} width={PAD_W} height={PAD_H} fill={`url(#${stripes})`} />}
              <rect x={x} y={y} width={PAD_W} height="10" fill="#000" opacity=".18" />
              <rect x={x} y={y + PAD_H - 4} width={PAD_W} height="4" fill="#fff" opacity=".12" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
