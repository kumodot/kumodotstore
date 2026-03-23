import { useState } from "react";
import { useColorsStore } from "./useColorsStore.ts";
import type { FilamentColor } from "@/types/index.ts";
import { colorsStore } from "@/data/colorsStore.ts";
import { exportColorsTs } from "./exportUtils.ts";

interface EditingColor {
  id: string;
  name: string;
  hex: string;
  available: boolean;
}

function ColorRow({
  color,
  onSave,
  onRemove,
  onToggle,
}: {
  color: FilamentColor;
  onSave: (id: string, data: Partial<FilamentColor>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EditingColor | null>(null);

  const startEdit = () =>
    setEditing({ id: color.id, name: color.name, hex: color.hex, available: color.available });

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing) return;
    onSave(color.id, {
      name: editing.name,
      hex: editing.hex,
      rgb: colorsStore.hexToRgb(editing.hex),
    });
    setEditing(null);
  };

  return (
    <tr className="border-b border-border hover:bg-surface-hover transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border border-border shrink-0"
            style={{ backgroundColor: editing ? editing.hex : color.hex }}
          />
          {editing && (
            <input
              type="color"
              value={editing.hex}
              onChange={(e) => setEditing({ ...editing, hex: e.target.value })}
              className="w-10 h-8 cursor-pointer rounded"
            />
          )}
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-sm text-accent">{color.id}</td>
      <td className="py-3 px-4">
        {editing ? (
          <input
            type="text"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="bg-surface border border-border rounded px-2 py-1 text-sm
                       text-text-primary focus:border-accent focus:outline-none w-full"
          />
        ) : (
          <span className="text-sm text-text-primary">{color.name}</span>
        )}
      </td>
      <td className="py-3 px-4">
        {editing ? (
          <input
            type="text"
            value={editing.hex}
            onChange={(e) => setEditing({ ...editing, hex: e.target.value })}
            className="bg-surface border border-border rounded px-2 py-1 text-sm
                       font-mono text-text-primary focus:border-accent focus:outline-none w-24"
            maxLength={7}
          />
        ) : (
          <span className="text-sm font-mono text-text-secondary">{color.hex}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onToggle(color.id)}
          className={`text-xs px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
            color.available
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-surface-elevated text-text-muted hover:bg-surface-hover"
          }`}
        >
          {color.available ? "Active" : "Hidden"}
        </button>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                className="text-xs px-3 py-1 bg-accent text-surface rounded font-medium
                           hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs px-3 py-1 bg-surface-elevated border border-border
                           text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="text-xs px-3 py-1 bg-surface-elevated border border-border
                           text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remove color "${color.name}" (${color.id})?`)) {
                    onRemove(color.id);
                  }
                }}
                className="text-xs px-3 py-1 bg-red-500/20 text-red-400
                           rounded hover:bg-red-500/30 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

interface NewColorForm {
  id: string;
  name: string;
  hex: string;
}

export function ColorsAdmin() {
  const { colors, updateColor, addColor, removeColor, toggleAvailable, resetToDefaults } =
    useColorsStore();

  const [adding, setAdding] = useState(false);
  const [newColor, setNewColor] = useState<NewColorForm>({ id: "", name: "", hex: "#ff0000" });
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const id = newColor.id.toUpperCase().trim();
    const name = newColor.name.trim();

    if (!id || id.length < 1 || id.length > 4) {
      setError("ID must be 1–4 uppercase characters (e.g. RD, PK)");
      return;
    }
    if (!name) {
      setError("Name is required");
      return;
    }
    if (colors.find((c) => c.id === id)) {
      setError(`ID "${id}" already exists`);
      return;
    }

    addColor({
      id,
      name,
      hex: newColor.hex,
      rgb: colorsStore.hexToRgb(newColor.hex),
      available: true,
    });
    setNewColor({ id: "", name: "", hex: "#ff0000" });
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{colors.length} colors</p>
        <div className="flex gap-2">
          <button
            onClick={() => exportColorsTs(colors)}
            className="text-sm px-4 py-2 bg-accent text-surface font-medium rounded-lg
                       hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Export colors.ts ↓
          </button>
          <button
            onClick={() => {
              if (confirm("Reset all colors to factory defaults?")) resetToDefaults();
            }}
            className="text-sm px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30
                       rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Color</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">ID</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Name</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Hex</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Status</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <ColorRow
                key={color.id}
                color={color}
                onSave={updateColor}
                onRemove={removeColor}
                onToggle={toggleAvailable}
              />
            ))}
          </tbody>
        </table>
      </div>

      {adding ? (
        <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Add New Color</h3>
          {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">ID (2–4 chars)</label>
              <input
                type="text"
                value={newColor.id}
                onChange={(e) => setNewColor({ ...newColor, id: e.target.value.toUpperCase() })}
                placeholder="e.g. PK"
                maxLength={4}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm
                           font-mono text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                placeholder="e.g. Pink"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm
                           text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="w-10 h-9 cursor-pointer rounded border border-border"
                />
                <input
                  type="text"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm
                             font-mono text-text-primary focus:border-accent focus:outline-none"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-accent text-surface font-medium rounded-lg text-sm
                         hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Add Color
            </button>
            <button
              onClick={() => { setAdding(false); setError(""); }}
              className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary
                         rounded-lg text-sm hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-surface-card border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary
                     transition-colors cursor-pointer"
        >
          + Add New Color
        </button>
      )}

      <div className="mt-6 p-4 bg-surface-card border border-border rounded-xl">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-medium">How to use:</span> Edit colors here,
          then click <strong>Export colors.ts</strong> — it downloads the file ready to replace{" "}
          <code className="font-mono">src/data/colors.ts</code>. Color IDs are used in order
          codes — do not change an existing ID or old codes will break.
        </p>
      </div>
    </div>
  );
}
