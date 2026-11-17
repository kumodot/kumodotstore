import { createPortal } from "react-dom";
import { useState } from "react";
import { BACKEND_URL } from "@/config/site.ts";

// Apps Script web app URL. Same URL lives in telegramNotify.ts and CartModal.tsx
// (see STORE_BIBLE §20). It used to be duplicated in StorefrontPage.tsx too; the
// modal moved here so the Kustomizer can share it, which keeps the count at 3.

export function NotifyModal({ productId, productName, type, title, blurb, discountCode, discountPercent, discountUntil, onClose }: {
  productId: string;
  productName: string;
  type: "restock" | "launch";
  title?: string;   // overrides the default heading
  blurb?: string;   // overrides the default line under it
  discountCode?: string;      // shown right after signing up (an Etsy code the shop created)
  discountPercent?: number;
  discountUntil?: string;     // e.g. "Nov 22"
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error" | "invalid">("idle");
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setState("invalid"); return; }
    setState("sending");
    try {
      fetch(BACKEND_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: import.meta.env.VITE_BACKEND_SECRET,
          action: "waitlist",
          waitlistType: type,
          productId,
          productName,
          email: email.trim(),
        }),
      });
      setState("ok");
      if (!discountCode) setTimeout(onClose, 2000);   // with a code to show, the buyer closes it
    } catch {
      setState("error");
    }
  };

  // rendered in <body>: inside the navbar (backdrop-filter) a fixed box would be sized by the navbar
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
    >
      {/* scrolls when the window is shorter than the dialog; a click on the margin closes it */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-semibold text-text-primary mb-1">
          {title ?? (type === "launch" ? "Notify me at launch" : "Notify me when back")}
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {blurb ?? `${productName} — we'll email you when it's available.`}
        </p>

        {state === "ok" ? (
          <div className="text-center py-1">
            <p className="text-sm text-green-400 py-1">✓ You're on the list!</p>
            {discountCode && (
              <>
                <p className="text-sm text-text-secondary mt-2">
                  Your {discountPercent}% off code for launch day{discountUntil ? `, valid until ${discountUntil}` : ""} (use it at Etsy checkout):
                </p>
                <code className="block font-mono text-lg text-accent bg-surface border border-border p-2 mt-2 select-all">{discountCode}</code>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => { try { await navigator.clipboard.writeText(discountCode); setCopied(true); } catch { /* select by hand */ } }}
                    className="flex-1 py-2 text-sm bg-accent text-[#0f0f0f] font-semibold cursor-pointer"
                  >
                    {copied ? "Copied ✓" : "Copy code"}
                  </button>
                  <button onClick={onClose} className="flex-1 py-2 text-sm border border-border text-text-muted cursor-pointer">Close</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border
                         text-text-primary text-sm placeholder:text-text-muted
                         focus:outline-none focus:border-accent mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm rounded-lg border border-border
                           text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={state === "sending" || !email.trim()}
                className="flex-1 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f]
                           font-semibold hover:bg-accent-hover transition-colors cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === "sending" ? "Sending..." : "Notify me"}
              </button>
            </div>
            {state === "invalid" && (
              <p className="text-xs text-red-400 mt-2 text-center">Please enter a valid email address.</p>
            )}
            {state === "error" && (
              <p className="text-xs text-red-400 mt-2 text-center">Something went wrong. Try again.</p>
            )}
          </>
        )}
      </div>
      </div>
    </div>,
    document.body,
  );
}
