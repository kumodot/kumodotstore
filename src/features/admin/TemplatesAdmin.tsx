import { useState } from "react";
import { TEMPLATES } from "@/data/templates.ts";
import { CASE_MODELS } from "@/data/caseModels.ts";
import { colorsStore } from "@/data/colorsStore.ts";
import { useKustomizer } from "@/features/kustomizer/hooks/useKustomizer.ts";
import { ButtonGrid } from "@/features/kustomizer/components/ButtonGrid.tsx";
import type { ColorTemplate } from "@/types/index.ts";

function exportTemplatesTs(templatesByModel: Record<string, ColorTemplate[]>): void {
  const modelBlocks = Object.entries(templatesByModel).map(([modelId, templates]) => {
    const lines = templates.map(
      (t) => `    { name: ${JSON.stringify(t.name)}, code: ${JSON.stringify(t.code)} },`
    );
    return `  ${JSON.stringify(modelId)}: [\n${lines.join("\n")}\n  ]`;
  });

  const content = `import type { ColorTemplate } from "@/types/index.ts";\n\nexport const TEMPLATES: Record<string, ColorTemplate[]> = {\n${modelBlocks.join(",\n")},\n};\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "templates.ts";
  a.click();
  URL.revokeObjectURL(url);
}

interface TemplateEditorProps {
  modelId: string;
  initial: ColorTemplate | null;
  existingNames: string[];
  onSave: (t: ColorTemplate) => void;
  onCancel: () => void;
}

function TemplateEditor({ modelId, initial, existingNames, onSave, onCancel }: TemplateEditorProps) {
  const model = CASE_MODELS.find((m) => m.id === modelId)!;
  const kustomizer = useKustomizer(
    model,
    initial ? [{ name: initial.name, code: initial.code }] : []
  );

  const [name, setName] = useState(initial?.name ?? "");
  const [pasteCode, setPasteCode] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [error, setError] = useState("");

  const colorOptions = colorsStore.getColors().filter((c) => c.available).map((c) => ({
    id: c.id,
    name: c.name,
    rgb: c.rgb,
  }));

  const handleSave = () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) { setError("Name is required"); return; }
    if (!initial && existingNames.includes(trimmed)) {
      setError(`Template "${trimmed}" already exists`);
      return;
    }
    onSave({ name: trimmed, code: kustomizer.formattedOrderCode });
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {initial ? `Edit: ${initial.name}` : "New Template"}
      </h3>

      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}

      <div>
        <label className="block text-xs text-text-secondary mb-1">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ALL RED"
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm
                     text-text-primary focus:border-accent focus:outline-none w-72"
        />
      </div>

      <div>
        <p className="text-xs text-text-secondary mb-2">Click a button to change its color:</p>
        <ButtonGrid
          model={model}
          selectedColors={kustomizer.selectedColors}
          activeButtonIndex={kustomizer.activeButtonIndex}
          onButtonClick={(i) =>
            kustomizer.setActiveButtonIndex(kustomizer.activeButtonIndex === i ? null : i)
          }
          onColorSelect={kustomizer.updateButtonColor}
          colorOptions={colorOptions}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs text-accent bg-surface px-3 py-1.5 rounded border border-border">
            {kustomizer.formattedOrderCode}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pasteCode}
            onChange={(e) => { setPasteCode(e.target.value); setPasteError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const ok = kustomizer.applyCode(pasteCode.trim());
                if (ok) { setPasteCode(""); setPasteError(""); }
                else setPasteError("Invalid code");
              }
            }}
            placeholder="Paste a code and press Enter"
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs
                       font-mono text-text-primary focus:border-accent focus:outline-none w-72"
          />
          <button
            onClick={() => {
              const ok = kustomizer.applyCode(pasteCode.trim());
              if (ok) { setPasteCode(""); setPasteError(""); }
              else setPasteError("Invalid code");
            }}
            className="text-xs px-3 py-1.5 bg-surface-elevated border border-border text-text-secondary
                       rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Apply
          </button>
          {pasteError && <span className="text-xs text-red-400">{pasteError}</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-accent text-surface font-medium rounded-lg text-sm
                     hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {initial ? "Save Changes" : "Add Template"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TemplatesAdmin() {
  const [selectedModelId, setSelectedModelId] = useState(CASE_MODELS[0].id);
  const [templatesByModel, setTemplatesByModel] = useState<Record<string, ColorTemplate[]>>(
    () => Object.fromEntries(
      CASE_MODELS.map((m) => [m.id, [...(TEMPLATES[m.id] ?? [])]])
    )
  );
  const [editing, setEditing] = useState<ColorTemplate | null>(null);
  const [adding, setAdding] = useState(false);

  const templates = templatesByModel[selectedModelId] ?? [];

  const handleSaveEdit = (updated: ColorTemplate) => {
    setTemplatesByModel((prev) => ({
      ...prev,
      [selectedModelId]: prev[selectedModelId].map((t) =>
        t.name === editing!.name ? updated : t
      ),
    }));
    setEditing(null);
  };

  const handleAdd = (newT: ColorTemplate) => {
    setTemplatesByModel((prev) => ({
      ...prev,
      [selectedModelId]: [...(prev[selectedModelId] ?? []), newT],
    }));
    setAdding(false);
  };

  const handleRemove = (name: string) => {
    if (!confirm(`Remove template "${name}"?`)) return;
    setTemplatesByModel((prev) => ({
      ...prev,
      [selectedModelId]: prev[selectedModelId].filter((t) => t.name !== name),
    }));
  };

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    setTemplatesByModel((prev) => {
      const list = [...prev[selectedModelId]];
      [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      return { ...prev, [selectedModelId]: list };
    });
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= templates.length - 1) return;
    setTemplatesByModel((prev) => {
      const list = [...prev[selectedModelId]];
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      return { ...prev, [selectedModelId]: list };
    });
  };

  const existingNames = templates.map((t) => t.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-text-secondary">{templates.length} templates</p>
          {CASE_MODELS.length > 1 && (
            <select
              value={selectedModelId}
              onChange={(e) => { setSelectedModelId(e.target.value); setEditing(null); setAdding(false); }}
              className="bg-surface-card border border-border rounded-lg px-3 py-1.5 text-sm
                         text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {CASE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => exportTemplatesTs(templatesByModel)}
          className="text-sm px-4 py-2 bg-accent text-surface font-medium rounded-lg
                     hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Export templates.ts ↓
        </button>
      </div>

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4 w-16">Order</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Name</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Code</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Preview</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t, idx) => (
              editing?.name === t.name ? (
                <tr key={t.name}>
                  <td colSpan={5} className="p-3">
                    <TemplateEditor
                      modelId={selectedModelId}
                      initial={editing}
                      existingNames={existingNames.filter((n) => n !== editing.name)}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditing(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={t.name} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col gap-0.5 items-center">
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0}
                        className="text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default text-xs leading-none">▲</button>
                      <span className="text-xs text-text-muted">{idx + 1}</span>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === templates.length - 1}
                        className="text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default text-xs leading-none">▼</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary font-medium">{t.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-accent">{t.code}</td>
                  <td className="py-3 px-4">
                    <TemplateColorDots code={t.code} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAdding(false); setEditing(t); }}
                        className="text-xs px-3 py-1 bg-surface-elevated border border-border
                                   text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(t.name)}
                        className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {adding ? (
        <TemplateEditor
          modelId={selectedModelId}
          initial={null}
          existingNames={existingNames}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => { setEditing(null); setAdding(true); }}
          className="px-4 py-2 bg-surface-card border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary
                     transition-colors cursor-pointer"
        >
          + Add New Template
        </button>
      )}

      <div className="mt-6 p-4 bg-surface-card border border-border rounded-xl">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-medium">How to use:</span> Edit templates
          visually, then click <strong>Export templates.ts</strong> — replace{" "}
          <code className="font-mono">src/data/templates.ts</code> and use{" "}
          <code className="font-mono">/product-push</code> to deploy.
        </p>
      </div>
    </div>
  );
}

function TemplateColorDots({ code }: { code: string }) {
  const colors = colorsStore.getColorsById();
  const ids = code.replace(/\//g, "_").split("_").filter(Boolean);
  return (
    <div className="grid grid-cols-4 gap-0.5 w-fit">
      {ids.map((id, i) => {
        const c = colors[id];
        const bg = c ? `rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})` : "#888";
        return (
          <div
            key={i}
            title={id}
            className="w-4 h-4 rounded-sm border border-border/50"
            style={{ backgroundColor: bg }}
          />
        );
      })}
    </div>
  );
}
