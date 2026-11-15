import { colorsStore } from "@/data/colorsStore.ts";

export function ColorLegend() {
  const colors = colorsStore.getColors().filter((c) => c.available);
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <h3 className="ks text-2xl text-text-primary mb-3">AVAILABLE COLORS</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {colors.map((color) => (
          <div key={color.id} className="flex items-center gap-1.5">
            <div
              style={{ backgroundColor: `rgb(${color.rgb.join(",")})` }}
              className="w-4 h-4 rounded-sm border border-border shrink-0"
            />
            <span className="text-xs text-text-secondary">
              {color.name}{" "}
              <span className="font-mono text-text-muted">({color.id})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
