import { forwardRef, useEffect, useRef, useState } from "react";
import type { CaseModel } from "@/types/index.ts";
import { getRgbStyle } from "../utils/colorSystem.ts";
import { ColorPicker } from "./ColorPicker.tsx";
import { playGlitch } from "@/utils/glitchSound.ts";

interface ButtonGridProps {
  model: CaseModel;
  selectedColors: string[];
  activeButtonIndex: number | null;
  onButtonClick: (index: number) => void;
  onColorSelect: (index: number, colorId: string) => void;
  colorOptions: { id: string; name: string; rgb: [number, number, number] }[];
  /** changes when a whole theme loads: the pads flicker random colors, then settle on the new ones */
  glitchTick?: number;
}

export const ButtonGrid = forwardRef<HTMLDivElement, ButtonGridProps>(
  function ButtonGrid(
    { model, selectedColors, activeButtonIndex, onButtonClick, onColorSelect, colorOptions, glitchTick = 0 },
    ref
  ) {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    // pad glitch on theme load: each pad flickers random palette colors, settling one by one (~0.25s) with a glitch sound
    const [flick, setFlick] = useState<(string | null)[]>([]);
    const mountedAt = useRef(performance.now());
    useEffect(() => {
      // the page applies its default theme right after mounting: that load stays still
      if (!glitchTick || performance.now() - mountedAt.current < 800 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const ids = colorOptions.map((c) => c.id);
      // a wave from top to bottom: each row settles a little after the one above, with some jitter inside the row
      const settle = selectedColors.map((_, i) => 40 + Math.floor(i / model.gridCols) * 55 + Math.random() * 70 + (i % model.gridCols) * 8);
      const end = Math.max(...settle);
      playGlitch(end + 40);
      const t0 = performance.now();
      const step = () => {
        const t = performance.now() - t0;
        if (t >= end) { setFlick([]); clearInterval(iv); return; }
        setFlick(settle.map((s) => (t >= s ? null : ids[(Math.random() * ids.length) | 0])));
      };
      const iv = setInterval(step, 38);
      step();
      return () => { clearInterval(iv); setFlick([]); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [glitchTick]);

    return (
      <div
        ref={ref}
        className="grid gap-2 p-4 bg-surface-elevated rounded-xl w-fit mx-auto"
        style={{ gridTemplateColumns: `repeat(${model.gridCols}, 1fr)` }}
      >
        {selectedColors.map((colorId, index) => (
          <div key={index} className="relative">
            <button
              ref={(el) => { buttonRefs.current[index] = el; }}
              onClick={() => onButtonClick(index)}
              style={{ backgroundColor: getRgbStyle(flick[index] ?? colorId) }}
              className="w-16 h-16 lg:w-24 lg:h-24 shadow-md hover:shadow-lg border border-border
                         transition-all duration-150 hover:scale-105 cursor-pointer"
            />

            {activeButtonIndex === index && buttonRefs.current[index] && (
              <ColorPicker
                anchorEl={buttonRefs.current[index]!}
                colorId={colorId}
                colorOptions={colorOptions}
                onSelect={(id) => onColorSelect(index, id)}
                onClose={() => onButtonClick(index)}
              />
            )}
          </div>
        ))}
      </div>
    );
  }
);