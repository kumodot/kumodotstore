import { useState } from "react";

const STORAGE_KEY = "kumodot_privacy_ok";

export function PrivacyBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-card border-t border-border px-4 py-3">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <p className="text-xs text-text-muted leading-relaxed">
          This site saves your shipping info locally on your device to pre-fill future orders.
          No personal data is sent to third parties — payments are processed securely by PayPal.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-xs font-medium px-4 py-1.5 rounded-lg bg-accent text-[#0f0f0f] hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
