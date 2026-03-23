import { useState } from "react";

interface CodeOutputProps {
  code: string;
  onExportImage: () => void;
}

export function CodeOutput({ code, onExportImage }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy. Please copy manually.");
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
        Order Code
      </h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 font-mono text-base text-accent bg-surface p-3 rounded-lg
                         overflow-x-auto border border-border whitespace-nowrap">
          {code}
        </code>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-accent text-surface font-medium rounded-lg
                       hover:bg-accent-hover transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onExportImage}
            className="px-4 py-2 bg-surface-elevated border border-border text-text-primary
                       font-medium rounded-lg hover:bg-surface-hover transition-colors
                       whitespace-nowrap cursor-pointer"
          >
            Save Image
          </button>
        </div>
      </div>
    </div>
  );
}
