import { useState, useMemo, useCallback } from "react";
import type { CaseModel, ColorTemplate } from "@/types/index.ts";
import { formatOrderCode, parseFormattedCode } from "../utils/colorSystem.ts";

export function useKustomizer(model: CaseModel, templates: ColorTemplate[]) {
  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    if (templates[0]) {
      const codes = parseFormattedCode(templates[0].code);
      if (codes.length >= model.buttonCount) return codes.slice(0, model.buttonCount);
    }
    return Array(model.buttonCount).fill(model.defaultColorId);
  });
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ColorTemplate | null>(
    templates[0] ?? null
  );

  const formattedOrderCode = useMemo(
    () => formatOrderCode(selectedColors, model),
    [selectedColors, model]
  );

  const findMatchingTemplate = useCallback(
    (colors: string[]) => {
      const code = formatOrderCode(colors, model);
      return templates.find((t) => t.code === code) ?? null;
    },
    [templates, model]
  );

  const applyTemplate = useCallback(
    (template: ColorTemplate) => {
      const codes = parseFormattedCode(template.code);
      if (codes.length >= model.buttonCount) {
        const sliced = codes.slice(0, model.buttonCount);
        setSelectedColors(sliced);
        setSelectedTemplate(template);
        setActiveButtonIndex(null);
      }
    },
    [model.buttonCount]
  );

  const updateButtonColor = useCallback(
    (index: number, colorId: string) => {
      setSelectedColors((prev) => {
        const next = [...prev];
        next[index] = colorId;
        const match = findMatchingTemplate(next);
        setSelectedTemplate(
          match ?? { name: "Custom", code: formatOrderCode(next, model) }
        );
        return next;
      });
      setActiveButtonIndex(null);
    },
    [model, findMatchingTemplate]
  );

  const applyCode = useCallback(
    (code: string): boolean => {
      const codes = parseFormattedCode(code);
      if (codes.length < model.buttonCount) return false;

      const sliced = codes.slice(0, model.buttonCount);
      setSelectedColors(sliced);
      const match = findMatchingTemplate(sliced);
      setSelectedTemplate(
        match ?? { name: "Custom", code: formatOrderCode(sliced, model) }
      );
      setActiveButtonIndex(null);
      return true;
    },
    [model, findMatchingTemplate]
  );

  const reset = useCallback(() => {
    const defaults = Array(model.buttonCount).fill(model.defaultColorId);
    setSelectedColors(defaults);
    setSelectedTemplate(null);
    setActiveButtonIndex(null);
  }, [model]);

  // Initialize with first template
  const initWithFirstTemplate = useCallback(() => {
    if (templates.length > 0) {
      applyTemplate(templates[0]);
    }
  }, [templates, applyTemplate]);

  return {
    selectedColors,
    activeButtonIndex,
    selectedTemplate,
    formattedOrderCode,
    setActiveButtonIndex,
    applyTemplate,
    updateButtonColor,
    applyCode,
    reset,
    initWithFirstTemplate,
  };
}
