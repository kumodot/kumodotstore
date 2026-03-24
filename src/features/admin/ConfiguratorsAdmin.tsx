import { useState } from "react";
import { VARIATION_CONFIGS } from "@/data/variationConfigs.ts";
import type { VariationConfig, VariationGroup, VariationOption } from "@/types/index.ts";
import { exportVariationConfigsTs } from "./exportUtils.ts";

const inputCls =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Option editor row ──────────────────────────────────────────────────────────
function OptionRow({
  option,
  onChange,
  onRemove,
}: {
  option: VariationOption;
  onChange: (o: VariationOption) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={option.label}
        onChange={(e) => {
          const label = e.target.value;
          onChange({ ...option, label, id: option.id || slugify(label) });
        }}
        placeholder="Label (e.g. Olive Green)"
        className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-text-muted">+CA$</span>
        <input
          type="number"
          value={option.priceDelta}
          onChange={(e) => onChange({ ...option, priceDelta: parseFloat(e.target.value) || 0 })}
          min={0}
          step={0.01}
          className="w-20 bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={option.imageUrl ?? ""}
        onChange={(e) => onChange({ ...option, imageUrl: e.target.value || undefined })}
        placeholder="Image URL (optional)"
        className="w-40 bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-text-muted focus:border-accent focus:outline-none"
      />
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 cursor-pointer shrink-0"
        title="Remove option"
      >
        ✕
      </button>
    </div>
  );
}

// ── Group editor ───────────────────────────────────────────────────────────────
function GroupEditor({
  group,
  onChange,
  onRemove,
}: {
  group: VariationGroup;
  onChange: (g: VariationGroup) => void;
  onRemove: () => void;
}) {
  const addOption = () => {
    const newOpt: VariationOption = { id: `opt-${Date.now()}`, label: "", priceDelta: 0 };
    onChange({ ...group, options: [...group.options, newOpt] });
  };

  const updateOption = (idx: number, opt: VariationOption) => {
    const options = [...group.options];
    options[idx] = opt;
    onChange({ ...group, options });
  };

  const removeOption = (idx: number) => {
    onChange({ ...group, options: group.options.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={group.name}
          onChange={(e) => {
            const name = e.target.value;
            onChange({ ...group, name, id: group.id || slugify(name) });
          }}
          placeholder="Group name (e.g. Color)"
          className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none font-medium"
        />
        <button
          onClick={() => onChange({ ...group, required: !group.required })}
          className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors shrink-0 ${
            group.required ? "bg-accent/20 text-accent" : "bg-surface-elevated text-text-muted"
          }`}
        >
          {group.required ? "Required" : "Optional"}
        </button>
        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors cursor-pointer shrink-0"
        >
          Remove group
        </button>
      </div>

      <div className="space-y-2 pl-2 border-l-2 border-border">
        <p className="text-xs text-text-muted mb-1">Options — Label / +Price add-on / Image (optional)</p>
        {group.options.map((opt, idx) => (
          <OptionRow
            key={idx}
            option={opt}
            onChange={(o) => updateOption(idx, o)}
            onRemove={() => removeOption(idx)}
          />
        ))}
        <button
          onClick={addOption}
          className="text-xs px-3 py-1.5 bg-surface-elevated border border-border text-text-secondary
                     rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}

// ── Config editor ──────────────────────────────────────────────────────────────
function ConfigEditor({
  initial,
  onSave,
  onCancel,
  existingIds,
}: {
  initial: VariationConfig | null;
  onSave: (c: VariationConfig) => void;
  onCancel: () => void;
  existingIds: string[];
}) {
  const isNew = !initial;
  const [config, setConfig] = useState<VariationConfig>(
    initial ?? { id: "", name: "", groups: [] }
  );
  const [error, setError] = useState("");

  const addGroup = () => {
    const g: VariationGroup = {
      id: `group-${Date.now()}`,
      name: "",
      required: true,
      options: [],
    };
    setConfig((c) => ({ ...c, groups: [...c.groups, g] }));
  };

  const updateGroup = (idx: number, g: VariationGroup) => {
    setConfig((c) => {
      const groups = [...c.groups];
      groups[idx] = g;
      return { ...c, groups };
    });
  };

  const removeGroup = (idx: number) => {
    setConfig((c) => ({ ...c, groups: c.groups.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    setError("");
    const id = config.id.trim() || slugify(config.name);
    if (!id) { setError("ID is required"); return; }
    if (isNew && existingIds.includes(id)) { setError(`ID "${id}" already exists`); return; }
    if (!config.name.trim()) { setError("Name is required"); return; }
    if (config.groups.length === 0) { setError("Add at least one group"); return; }
    for (const g of config.groups) {
      if (!g.name.trim()) { setError("All groups need a name"); return; }
      if (g.options.length === 0) { setError(`Group "${g.name}" needs at least one option`); return; }
      for (const o of g.options) {
        if (!o.label.trim()) { setError("All options need a label"); return; }
      }
    }
    // Finalize IDs from labels if still placeholder
    const groups = config.groups.map((g) => ({
      ...g,
      id: g.id.startsWith("group-") ? slugify(g.name) : g.id,
      options: g.options.map((o) => ({
        ...o,
        id: o.id.startsWith("opt-") ? slugify(o.label) : o.id,
      })),
    }));
    onSave({ ...config, id, groups });
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {isNew ? "New Configurator" : `Edit: ${initial?.name}`}
      </h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">ID *</label>
          <input
            type="text"
            value={config.id}
            onChange={(e) => setConfig((c) => ({ ...c, id: e.target.value }))}
            placeholder="op1-stands"
            disabled={!isNew}
            className={`${inputCls} font-mono ${!isNew ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Display Name *</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
            placeholder="OP-1 Stands"
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Groups</p>
        {config.groups.map((g, idx) => (
          <GroupEditor
            key={idx}
            group={g}
            onChange={(updated) => updateGroup(idx, updated)}
            onRemove={() => removeGroup(idx)}
          />
        ))}
        <button
          onClick={addGroup}
          className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary
                     transition-colors cursor-pointer"
        >
          + Add Group
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-accent text-surface font-medium rounded-lg text-sm hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {isNew ? "Create Configurator" : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────
export function ConfiguratorsAdmin() {
  const [configs, setConfigs] = useState<VariationConfig[]>([...VARIATION_CONFIGS]);
  const [editing, setEditing] = useState<VariationConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSave = (updated: VariationConfig) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setIsEditing(false);
    setEditing(null);
  };

  const handleAdd = (newConfig: VariationConfig) => {
    setConfigs((prev) => [...prev, newConfig]);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    if (confirm(`Remove configurator "${id}"?`)) {
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const startEdit = (c: VariationConfig) => {
    setEditing(c);
    setIsEditing(true);
    setAdding(false);
  };

  const existingIds = configs.map((c) => c.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{configs.length} configurator{configs.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => exportVariationConfigsTs(configs)}
          className="text-sm px-4 py-2 bg-accent text-surface font-medium rounded-lg
                     hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Export variationConfigs.ts ↓
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 mb-4">
        {configs.map((c) =>
          isEditing && editing?.id === c.id ? (
            <ConfigEditor
              key={c.id}
              initial={editing}
              onSave={handleSave}
              onCancel={() => { setIsEditing(false); setEditing(null); }}
              existingIds={existingIds}
            />
          ) : (
            <div
              key={c.id}
              className="bg-surface-card border border-border rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary text-sm">{c.name}</span>
                  <code className="text-xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">{c.id}</code>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.groups.map((g) => (
                    <div key={g.id} className="text-xs text-text-secondary">
                      <span className="text-text-muted">{g.name}:</span>{" "}
                      {g.options.map((o, i) => (
                        <span key={o.id}>
                          {o.label}{o.priceDelta > 0 ? <span className="text-accent"> +${o.priceDelta}</span> : ""}
                          {i < g.options.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(c)}
                  className="text-xs px-3 py-1 bg-surface-elevated border border-border
                             text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding ? (
        <ConfigEditor
          initial={null}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          existingIds={existingIds}
        />
      ) : !isEditing && (
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-surface-card border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary
                     transition-colors cursor-pointer"
        >
          + Add New Configurator
        </button>
      )}

      <div className="mt-6 p-4 bg-surface-card border border-border rounded-xl">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-medium">How to use:</span> Create or edit configurators here,
          then click <strong>Export variationConfigs.ts</strong> — it downloads the file ready to replace{" "}
          <code className="font-mono">src/data/variationConfigs.ts</code>.
          Link a configurator to a product via the <strong>Products</strong> tab (Variation Config field).
        </p>
      </div>
    </div>
  );
}
