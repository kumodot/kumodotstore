import { useState, useEffect } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import type { FilamentColor } from "@/types/index.ts";

export function useColorsStore() {
  const [colors, setColors] = useState<FilamentColor[]>(() =>
    colorsStore.getColors()
  );

  useEffect(() => {
    const unsubscribe = colorsStore.subscribe(() => {
      setColors([...colorsStore.getColors()]);
    });
    return () => { unsubscribe(); };
  }, []);

  return {
    colors,
    updateColor: colorsStore.updateColor.bind(colorsStore),
    addColor: colorsStore.addColor.bind(colorsStore),
    removeColor: colorsStore.removeColor.bind(colorsStore),
    toggleAvailable: colorsStore.toggleAvailable.bind(colorsStore),
    resetToDefaults: colorsStore.resetToDefaults.bind(colorsStore),
  };
}
