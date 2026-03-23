import { useState } from "react";

interface CodeInputProps {
  onApply: (code: string) => boolean;
}

export function CodeInput({ onApply }: CodeInputProps) {
  const [code, setCode] = useState("");

  const handleApply = () => {
    if (!code.trim()) return;
    const success = onApply(code.trim());
    if (!success) {
      alert("Invalid code format. Please provide at least 16 color codes.");
    } else {
      setCode("");
    }
  };

  return (
    <div>
      <label
        htmlFor="custom-code"
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        Or paste a code
      </label>
      <div className="flex gap-2">
        <input
          id="custom-code"
          type="text"
          className="flex-1 p-2.5 bg-surface-card border border-border rounded-lg
                     text-text-primary placeholder:text-text-muted
                     focus:border-accent focus:outline-none font-mono text-sm"
          placeholder="BK_WH_BK_WH/WH_BK_WH_BK/..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <button
          className="px-4 py-2.5 bg-accent text-surface font-medium rounded-lg
                     hover:bg-accent-hover transition-colors cursor-pointer"
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
