import { forwardRef, useRef } from "react";
import type { CaseModel } from "@/types/index.ts";
import { getRgbStyle } from "../utils/colorSystem.ts";
import { ColorPicker } from "./ColorPicker.tsx";

interface ButtonGridProps {
  model: CaseModel;
  selectedColors: string[];
  activeButtonIndex: number | null;
  onButtonClick: (index: number) => void;
  onColorSelect: (index: number, colorId: string) => void;
  colorOptions: { id: string; name: string; rgb: [number, number, number] }[];
}

export const ButtonGrid = forwardRef<HTMLDivElement, ButtonGridProps>(
  function ButtonGrid(
    { model, selectedColors, activeButtonIndex, onButtonClick, onColorSelect, colorOptions },
    ref
  ) {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
              style={{ backgroundColor: getRgbStyle(colorId) }}
              className="w-16 h-16 rounded-lg shadow-md hover:shadow-lg border border-border
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