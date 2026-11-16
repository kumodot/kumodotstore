import { createPortal } from "react-dom";

// Small in-page confirm (the browser confirm() is blocked or ugly in some browsers).
export function ConfirmModal({ title, text, yes, no = "Keep editing", onYes, onNo, alt }: {
  title: string; text: string; yes: string; no?: string; onYes: () => void; onNo: () => void;
  alt?: { label: string; onClick: () => void };   // main action (accent), `yes` then becomes the plain one
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={onNo}>
      <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-surface-card border border-border-light p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="ks text-xl text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-4">{text}</p>
        <div className="flex flex-col gap-2">
          {alt && <button onClick={alt.onClick} className="min-h-11 bg-accent text-[#0D0D0C] font-medium cursor-pointer hover:bg-accent-hover transition-colors">{alt.label}</button>}
          <button onClick={onYes} className={`min-h-11 cursor-pointer transition-colors ${alt ? "border border-border-light text-text-primary hover:border-accent hover:text-accent" : "bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover"}`}>{yes}</button>
          <button onClick={onNo} className="min-h-11 border border-border-light text-text-primary cursor-pointer hover:border-accent hover:text-accent transition-colors">{no}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
