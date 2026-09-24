import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);

  const productId = searchParams.get("product");
  const editLineId = searchParams.get("editLineId");
  const editCode = searchParams.get("code");
  const product = productId ? PRODUCTS.find((p) => p.id === productId) : null;

  // Model resolution, most specific first: the path (/kustomize/pokz-02, built
  // by the cart and the storefront), then ?model= on the model-free link, then
  // the default. An unknown id falls back rather than redirecting — rewriting
  // the URL is what put a model name in front of buyers in the first place.
  const requestedId = modelId ?? searchParams.get("model") ?? undefined;
  const model =
    (requestedId && MODELS_BY_ID[requestedId]) || MODELS_BY_ID[DEFAULT_MODEL_ID];
  const templates = TEMPLATES[model?.id] ?? [];

  const kustomizer = useKustomizer(model, templates);

  useEffect(() => {
    if (editCode) {
      kustomizer.applyCode(editCode);
    } else {
      const default808 = templates.find((t) => t.name.includes("808"));
      if (default808) kustomizer.applyCode(default808.code);
      else kustomizer.initWithFirstTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.id]);

  // Only reachable if CASE_MODELS is empty — a build mistake, not a bad URL.
  if (!model) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center text-text-secondary">
        No case models are configured.
      </div>
    );
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
                // ?model=, not /kustomize/<id>: the path form would put the
                // model back in the URL the buyer sees and copies. Existing
                // params (product, editLineId, code) are carried over, or
                // switching model mid-edit would drop the cart line.
                const next = new URLSearchParams(searchParams);
                next.set("model", e.target.value);
                navigate(`/kustomize?${next}`, { replace: true });
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
          onAddToCart={product ? () => {
            if (editLineId) {
              cartStore.updateLine(editLineId, product, kustomizer.formattedOrderCode);
              navigate("/?openCart=1");
            } else {
              cartStore.add(product, kustomizer.formattedOrderCode);
            }
          } : undefined}
          editMode={!!editLineId}
        />

        <ColorLegend />
      </div>
    </div>
  );
}
