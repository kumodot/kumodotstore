import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ColorPickerProps {
  anchorEl: HTMLElement;
  colorId: string;
  colorOptions: { id: string; name: string; rgb: [number, number, number] }[];
  onSelect: (colorId: string) => void;
  onClose: () => void;
}

export function ColorPicker({ anchorEl, colorId, colorOptions, onSelect, onClose }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Position relative to anchor button
  const rect = anchorEl.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  let top = rect.bottom + scrollY + 8;
  let left = rect.left + scrollX;

  // Clamp to viewport width (picker is ~176px: 4 cols * 40px + padding)
  const pickerWidth = 176;
  if (left + pickerWidth > window.innerWidth - 8) {
    left = window.innerWidth - pickerWidth - 8 + scrollX;
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
          !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [anchorEl, onClose]);

  const picker = (
    <div
      ref={pickerRef}
      className="fixed z-[9999] p-2 bg-surface-card rounded-lg shadow-2xl border border-border grid grid-cols-4 gap-1"
      style={{ top, left }}
    >
      {colorOptions.map((option) => (
        <button
          key={option.id}
          style={{ backgroundColor: `rgb(${option.rgb[0]}, ${option.rgb[1]}, ${option.rgb[2]})` }}
          className={`w-8 h-8 rounded border transition-all duration-100 cursor-pointer
            ${colorId === option.id
              ? "border-accent scale-110 ring-2 ring-accent-muted"
              : "border-border hover:border-text-secondary hover:scale-105"
            }`}
          onClick={() => { onSelect(option.id); onClose(); }}
          title={option.name}
        />
      ))}
    </div>
  );

  return createPortal(picker, document.body);
}