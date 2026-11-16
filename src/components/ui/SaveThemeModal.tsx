import { useState } from "react";
import { createPortal } from "react-dom";

// Asks for a name before saving the buyer's customization as a theme in the filmstrip.
export function SaveThemeModal({ defaultName, onSave, onClose }: {
  defaultName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const ok = name.trim().length > 0;
  const save = () => { if (ok) onSave(name.trim().slice(0, 24)); };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-surface-card border border-border-light p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="ks text-xl text-text-primary mb-2">Save your theme?</h3>
        <p className="text-sm text-text-secondary mb-3">
          It is saved on this device only (in this browser). Nobody else sees it, and it is gone if you clear your browser data.
        </p>
        <input
          autoFocus
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onClose(); }}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="Theme name"
          className="w-full mb-4 px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 min-h-11 border border-border-light text-text-primary cursor-pointer hover:border-accent hover:text-accent transition-colors">Not now</button>
          <button onClick={save} disabled={!ok} className="flex-1 min-h-11 bg-accent text-[#0D0D0C] font-medium cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
