import { forwardRef } from "react";
import type { CaseModel } from "@/types/index.ts";
import { getRgbStyle } from "../utils/colorSystem.ts";

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
    return (
      <div
        ref={ref}
        className="grid gap-2 p-4 bg-surface-elevated rounded-xl w-fit mx-auto"
        style={{ gridTemplateColumns: `repeat(${model.gridCols}, 1fr)` }}
      >
        {selectedColors.map((colorId, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => onButtonClick(index)}
              style={{ backgroundColor: getRgbStyle(colorId) }}
              className="w-16 h-16 rounded-lg shadow-md hover:shadow-lg border border-border
                         transition-all duration-150 hover:scale-105 cursor-pointer"
            />

            {activeButtonIndex === index && (
              <div className="absolute mt-2 p-2 bg-surface-card rounded-lg shadow-2xl z-50
                              grid grid-cols-4 gap-1 border border-border">
                {colorOptions.map((option) => (
                  <button
                    key={option.id}
                    style={{
                      backgroundColor: `rgb(${option.rgb[0]}, ${option.rgb[1]}, ${option.rgb[2]})`,
                    }}
                    className={`w-8 h-8 rounded border transition-all duration-100 cursor-pointer
                      ${
                        colorId === option.id
                          ? "border-accent scale-110 ring-2 ring-accent-muted"
                          : "border-border hover:border-text-secondary hover:scale-105"
                      }`}
                    onClick={() => onColorSelect(index, option.id)}
                    title={option.name}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);
