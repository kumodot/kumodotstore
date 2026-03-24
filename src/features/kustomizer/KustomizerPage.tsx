import { useEffect, useRef } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { cartStore } from "@/data/cartStore.ts";
import { MODELS_BY_ID, CASE_MODELS, DEFAULT_MODEL_ID } from "@/data/caseModels.ts";
import { TEMPLATES } from "@/data/templates.ts";
import { colorsStore } from "@/data/colorsStore.ts";
import { useKustomizer } from "./hooks/useKustomizer.ts";
import { exportGridAsImage } from "./utils/imageExport.ts";
import { ButtonGrid } from "./components/ButtonGrid.tsx";
import { TemplateSelector } from "./components/TemplateSelector.tsx";
import { CodeInput } from "./components/CodeInput.tsx";
import { CodeOutput } from "./components/CodeOutput.tsx";
import { ColorLegend } from "./components/ColorLegend.tsx";

export function KustomizerPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const [searchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);

  const productId = searchParams.get("product");
  const product = productId ? PRODUCTS.find((p) => p.id === productId) : null;

  const model = MODELS_BY_ID[modelId ?? DEFAULT_MODEL_ID];
  const templates = TEMPLATES[model?.id] ?? [];

  const kustomizer = useKustomizer(model, templates);

  useEffect(() => {
    kustomizer.initWithFirstTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.id]);

  if (!model) {
    return <Navigate to={`/kustomize/${DEFAULT_MODEL_ID}`} replace />;
  }

  const colorOptions = colorsStore.getColors().filter((c) => c.available).map((c) => ({
    id: c.id,
    name: c.name,
    rgb: c.rgb,
  }));

  const handleExportImage = async () => {
    if (gridRef.current) {
      await exportGridAsImage(
        gridRef.current,
        kustomizer.selectedTemplate?.name ?? "custom"
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          <span className="text-red-500">K</span><span className="text-accent">ustomizer</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">{model.description}</p>

        {CASE_MODELS.length > 1 && (
          <div className="mt-3">
            <select
              className="p-2 bg-surface-card border border-border rounded-lg text-text-primary
                         text-sm focus:border-accent focus:outline-none cursor-pointer"
              value={model.id}
              onChange={(e) => {
                window.location.hash = `/kustomize/${e.target.value}`;
              }}
            >
              {CASE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <TemplateSelector
          templates={templates}
          selectedTemplate={kustomizer.selectedTemplate}
          onSelect={kustomizer.applyTemplate}
        />

        <CodeInput onApply={kustomizer.applyCode} />

        <ButtonGrid
          ref={gridRef}
          model={model}
          selectedColors={kustomizer.selectedColors}
          activeButtonIndex={kustomizer.activeButtonIndex}
          onButtonClick={(i) =>
            kustomizer.setActiveButtonIndex(
              kustomizer.activeButtonIndex === i ? null : i
            )
          }
          onColorSelect={kustomizer.updateButtonColor}
          colorOptions={colorOptions}
        />

        <CodeOutput
          code={kustomizer.formattedOrderCode}
          onExportImage={handleExportImage}
          onAddToCart={product ? () => cartStore.add(product, kustomizer.formattedOrderCode) : undefined}
        />

        <ColorLegend />
      </div>
    </div>
  );
}
