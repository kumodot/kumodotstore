import { createPortal } from "react-dom";
import { useState } from "react";
import { SITE } from "@/config/site.ts";
import { GlitchTitle } from "./GlitchTitle.tsx";

// Shown after COPY in every Kustomizer: thanks the buyer, explains how to send the code
// through Etsy messages, and offers the image as an alternative (or addition).
export function OrderCopiedModal({ code, copied, onSaveImage, onClose }: {
  code: string;                     // shown in the box so it can be copied by hand if the clipboard was blocked
  copied: boolean;
  onSaveImage: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const save = async () => {
    await onSaveImage();
    setSaved(true);
  };

  // rendered in <body>: inside the navbar (backdrop-filter) a fixed box would be sized by the navbar
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Code copied"
    >
      {/* scrolls when the window is shorter than the dialog; a click on the margin closes it */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
      <div className="bg-surface-card border border-border w-full max-w-md p-6 shadow-2xl">
        <p className="mono text-accent mb-2">{copied ? "CODE COPIED" : "COPY YOUR CODE"}</p>
        <GlitchTitle as="h3" className="ks block text-3xl text-text-primary mb-4" text="THANK YOU FOR KUSTOMIZING!" auto={false} />
        <code className="block font-mono text-xs text-accent bg-surface border border-border p-2 mb-4 break-all whitespace-pre-wrap select-all max-h-28 overflow-auto">
          {code}
        </code>

        <p className="text-sm text-text-secondary mb-3">To order, add your code to the listing on Etsy:</p>
        <ol className="text-sm text-text-primary space-y-2 mb-4 list-none">
          <li><span className="text-accent">1.</span> Open the Kumodot Store listing on Etsy.</li>
          <li><span className="text-accent">2.</span> Paste the code in the <span className="mono text-text-primary">PERSONALIZATION</span> box (Ctrl+V, or tap and hold on a phone).</li>
          <li><span className="text-accent">3.</span> Add to cart and check out as usual.</li>
        </ol>
        <p className="text-sm text-text-secondary mb-2">
          Already placed your order? No problem, send the code to the shop in an Etsy message.
        </p>
        <p className="text-sm text-text-secondary mb-5">
          Prefer a picture? Save it as an image and attach it to that message, or send both.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={save}
            className="btn-brand flex-1 min-w-36 inline-flex items-center justify-center min-h-11 px-4 bg-text-primary
                       text-[#0D0D0C] font-mono text-xs font-medium uppercase tracking-[.06em] cursor-pointer"
          >
            {saved ? "Image saved ✓" : "Save image"}
          </button>
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-36 inline-flex items-center justify-center min-h-11 px-4 border border-border-light
                       font-mono text-xs uppercase tracking-[.06em] text-text-primary hover:border-accent hover:text-accent transition-colors"
          >
            Open Etsy ↗
          </a>
          <button
            onClick={onClose}
            className="w-full min-h-11 border border-border font-mono text-xs uppercase tracking-[.06em]
                       text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}
