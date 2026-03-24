import { useState } from "react";

interface CodeOutputProps {
  code: string;
  onExportImage: () => void;
  onAddToCart?: () => void;
}

export function CodeOutput({ code, onExportImage, onAddToCart }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Split "AA_BB_CC_DD/EE_FF_GG_HH/..." into lines
  const lines = code.split("/");

  const handleCopy = async () => {
    const multiline = lines.map((l) => l + "/").join("\n");
    try {
      await navigator.clipboard.writeText(multiline);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: single-line with /
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("Failed to copy. Please copy manually.");
      }
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
        Order Code
      </h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 font-mono text-base text-accent bg-surface p-3 rounded-lg
                         border border-border leading-relaxed">
          {lines.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </code>
        <div className="flex sm:flex-col gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-4 py-2 bg-accent text-surface font-medium rounded-lg
                       hover:bg-accent-hover transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onExportImage}
            className="flex-1 sm:flex-none px-4 py-2 bg-surface-elevated border border-border text-text-primary
                       font-medium rounded-lg hover:bg-surface-hover transition-colors
                       whitespace-nowrap cursor-pointer"
          >
            Save Image
          </button>
          {onAddToCart && (
            <button
              onClick={handleAddToCart}
              className={`flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg transition-colors
                         whitespace-nowrap cursor-pointer flex items-center justify-center gap-2
                         ${added
                           ? "bg-green-500/20 text-green-400"
                           : "bg-accent text-[#0f0f0f] hover:bg-accent-hover"
                         }`}
            >
              {added ? "Added ✓" : (
                <><img src="/add-to-bag_blue.png" alt="" className="w-5 h-5 object-contain" /> Add to Cart</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}