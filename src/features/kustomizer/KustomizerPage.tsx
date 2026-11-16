import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { cartStore } from "@/data/cartStore.ts";
import { MODELS_BY_ID, CASE_MODELS, DEFAULT_MODEL_ID } from "@/data/caseModels.ts";
import { TEMPLATES } from "@/data/templates.ts";
import { colorsStore } from "@/data/colorsStore.ts";
import { useKustomizer } from "./hooks/useKustomizer.ts";
import { exportGridAsImage } from "./utils/imageExport.ts";
import { ButtonGrid } from "./components/ButtonGrid.tsx";
import { SaveThemeModal } from "@/components/ui/SaveThemeModal.tsx";
import { ConfirmModal } from "@/components/ui/ConfirmModal.tsx";
import { ThemeFilmstrip } from "@/components/ui/ThemeFilmstrip.tsx";
import { PokzThumb } from "./components/PokzThumb.tsx";
import { CodeInput } from "./components/CodeInput.tsx";
import { CodeOutput } from "./components/CodeOutput.tsx";
import { ColorLegend } from "./components/ColorLegend.tsx";
import { GlitchTitle } from "@/components/ui/GlitchTitle.tsx";
import { isSoundOn, setSoundOn } from "@/utils/glitchSound.ts";
import { KUSTOMIZER_PRODUCTS } from "@/data/kustomizerProducts.ts";
import { offeredColors } from "@/data/colorAvailability.ts";

// three.js only loads when a buyer opens an FM1 kit, POKZ stays as light as before.
const Fm1Kustomizer = lazy(() =>
  import("@/features/fm1/Fm1Kustomizer.tsx").then((m) => ({ default: m.Fm1Kustomizer }))
);

// Themes the buyer saved for a case model. Stored in this browser only (localStorage), never sent anywhere.
type SavedTheme = { name: string; code: string };
const savedKey = (modelId: string) => `kumodot_saved_themes_v1_${modelId}`;
function loadSavedThemes(modelId: string): SavedTheme[] {
  try { return JSON.parse(localStorage.getItem(savedKey(modelId)) ?? "[]"); } catch { return []; }
}

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
  const [sound, setSound] = useState(isSoundOn);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);   // the saved theme the buyer is editing, if any
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(() => loadSavedThemes(model.id));
  useEffect(() => { setSavedThemes(loadSavedThemes(model.id)); }, [model.id]);
  const nextName = () => `Custom ${Math.max(0, ...savedThemes.map((t) => Number(/^Custom (\d+)$/.exec(t.name)?.[1] ?? 0))) + 1}`;
  const saveCurrent = (name = nextName()) => {
    const taken = new Set([...templates, ...savedThemes].map((t) => t.name));
    let unique = name;
    for (let i = 2; taken.has(unique); i++) unique = `${name} ${i}`;
    persistSaved([...savedThemes, { name: unique, code: kustomizer.formattedOrderCode }]);
    return unique;
  };
  // the buyer's own, unsaved customization shows up as an extra card in the strip ("Not saved")
  const isDraft = !kustomizer.selectedTemplate && !savedThemes.some((x) => x.code === kustomizer.formattedOrderCode);
  const editingSaved = isDraft && origin && savedThemes.some((x) => x.name === origin) ? origin : null;   // shows "Update?" on that card
  const loadTheme = (id: string) => {
    const t = templates.find((x) => x.name === id) ?? savedThemes.find((x) => x.name === id);
    if (t) { setOrigin(savedThemes.some((x) => x.name === id) ? id : null); kustomizer.applyTemplate(t); }
  };
  const persistSaved = (list: SavedTheme[]) => {
    setSavedThemes(list);
    try { localStorage.setItem(savedKey(model.id), JSON.stringify(list)); } catch { /* private mode */ }
  };

  // Which kit: ?kit= picks one, anything else (including old links) is POKZ.
  const kit = KUSTOMIZER_PRODUCTS.find((p) => p.id === searchParams.get("kit")) ?? KUSTOMIZER_PRODUCTS[0];
  const pickKit = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === KUSTOMIZER_PRODUCTS[0].id) next.delete("kit"); else next.set("kit", id);
    navigate(`/kustomize${next.size ? `?${next}` : ""}`, { replace: true });
  };

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

  const colorOptions = offeredColors("pokz", colorsStore.getColors()).map((c) => ({
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

  const picker = (
    <div className="flex gap-2 sm:gap-3 justify-center mb-6" role="tablist" aria-label="Choose your product">
      {KUSTOMIZER_PRODUCTS.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={p.id === kit.id}
          onClick={() => pickKit(p.id)}
          className={`group flex-1 max-w-44 border p-1.5 cursor-pointer text-center transition-colors duration-[450ms]
                      ${p.id === kit.id ? "border-accent bg-surface-card" : "border-border hover:border-accent"}`}
        >
          <span className="block overflow-hidden bg-[#050505]">
            <img src={p.image} alt="" className="w-full aspect-[4/3] object-cover transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] group-hover:scale-[1.2]" loading="lazy" />
          </span>
          <GlitchTitle as="span" className="ks block text-lg sm:text-xl text-text-primary mt-2" text={p.name.toUpperCase()} auto={false} />
          {!p.launched && <span className="mono block text-accent mt-0.5">coming soon</span>}
        </button>
      ))}
    </div>
  );

  if (kit.kind !== "grid") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-4">
          <GlitchTitle as="h1" className="ks text-3xl text-text-primary" text="KUSTOMIZER" />
          <p className="text-sm text-text-secondary mt-1">{kit.tagline}</p>
        </div>
        {picker}
        <Suspense fallback={<p className="text-center text-text-muted py-16">Loading 3D preview…</p>}>
          <Fm1Kustomizer key={kit.id} mode={kit.kind === "fm1-case" ? "case" : "knobs"} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-8">
      {/* glitch sound switch: just an icon in the corner (speaker open / speaker crossed out) */}
      <button
        onClick={() => { setSoundOn(!sound); setSound(!sound); }}
        aria-label={sound ? "Sound on, click to mute" : "Sound off, click to unmute"}
        aria-pressed={sound}
        title={sound ? "Sound on" : "Sound off"}
        className="absolute right-4 top-3 w-10 h-10 flex items-center justify-center text-text-muted
                   hover:text-accent transition-colors cursor-pointer"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          {sound ? (
            <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
          ) : (
            <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
          )}
        </svg>
      </button>
      <div className="text-center mb-6">
        <GlitchTitle as="h1" className="ks text-3xl text-text-primary" text="KUSTOMIZER" />
        <p className="text-sm text-text-secondary mt-1">{model.description}</p>
        <div className="mt-4 -mb-2">{picker}</div>

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

      <div className="space-y-6">
        <ThemeFilmstrip
          aspect="aspect-[3/4]"
          items={[
            ...templates.map((t) => ({ id: t.name, name: t.name, thumb: <PokzThumb code={t.code} />, removable: false })),
            ...savedThemes.map((t) => t.name === editingSaved
              ? { id: t.name, name: "Update?", draft: true, thumb: <PokzThumb code={kustomizer.formattedOrderCode} />, removable: false }
              : { id: t.name, name: t.name, thumb: <PokzThumb code={t.code} />, removable: true }),
            ...(isDraft && !editingSaved ? [{ id: "__draft", name: "Not saved", draft: true, thumb: <PokzThumb code={kustomizer.formattedOrderCode} />, removable: false }] : []),
          ]}
          activeId={isDraft ? editingSaved ?? "__draft" : kustomizer.selectedTemplate?.name ?? savedThemes.find((x) => x.code === kustomizer.formattedOrderCode)?.name ?? null}
          onSelect={(id) => {
            if (id === "__draft") return setNaming(true);   // the unsaved card: offer to save it
            if (id === editingSaved) return setUpdating(true);   // an edited saved theme: update it or save a new one
            // own edits that are not saved as a theme would be lost: ask first
            if (isDraft) return setPendingTheme(id);
            loadTheme(id);
          }}
          onRemove={(id) => persistSaved(savedThemes.filter((t) => t.name !== id))}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
          <div className="lg:sticky lg:top-24">
            <div className="text-center mb-2">
              <GlitchTitle as="h2" className="ks text-2xl text-text-primary block !leading-none" text="DO YOUR OWN" />
              <span className="mono block mt-1">(CLICK the BUTTONS)</span>
              {/* the loaded theme; turns into CUSTOM as soon as a pad is changed */}
              <span className="mono block mt-2 text-text-primary">
                LOADED: <span className="text-accent">{(kustomizer.selectedTemplate?.name ?? "Custom").toUpperCase()}</span>
              </span>
            </div>
          <ButtonGrid
          ref={gridRef}
          glitchTick={kustomizer.loadTick}
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

          </div>
          <div className="space-y-4">
        <CodeInput onApply={kustomizer.applyCode} />

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
      </div>
      {updating && editingSaved && (
        <ConfirmModal title="Update this theme?" text={`You changed "${editingSaved}". Update it, or keep it as it was and save your version as a new theme.`}
          yes="Save as new" no="Cancel"
          alt={{ label: "Update", onClick: () => { persistSaved(savedThemes.map((x) => (x.name === editingSaved ? { ...x, code: kustomizer.formattedOrderCode } : x))); setOrigin(null); setUpdating(false); } }}
          onYes={() => { setUpdating(false); setNaming(true); }} onNo={() => setUpdating(false)} />
      )}
      {naming && (
        <SaveThemeModal defaultName={nextName()} onClose={() => setNaming(false)}
          onSave={(name) => { saveCurrent(name); setNaming(false); }} />
      )}
      {pendingTheme && (
        <ConfirmModal title="Change theme?" text="Your current customization will be lost. Save it as a new theme first to keep it."
          yes="Load without saving" alt={{ label: "Save mine, then load", onClick: () => { saveCurrent(); loadTheme(pendingTheme); setPendingTheme(null); } }} onYes={() => { loadTheme(pendingTheme); setPendingTheme(null); }} onNo={() => setPendingTheme(null)} />
      )}
    </div>
  );
}
