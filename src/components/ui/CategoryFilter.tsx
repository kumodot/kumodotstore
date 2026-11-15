import { Scramble } from "./Scramble.tsx";

interface CategoryFilterProps {
  categories: string[];
  active: Set<string>;
  onToggle: (cat: string) => void;
  onClear: () => void;
}

export function CategoryFilter({ categories, active, onToggle, onClear }: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      <span className="text-xs text-text-muted uppercase tracking-widest mr-1 shrink-0">
        Form Factor
      </span>
      {categories.map((cat) => {
        const isActive = active.has(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`px-3 min-h-9 font-mono uppercase text-[11px] border transition-colors
                        duration-150 cursor-pointer tracking-[.06em]
              ${isActive
                ? "bg-accent text-[#0f0f0f] border-accent"
                : "bg-transparent text-text-secondary border-border hover:border-text-muted hover:text-text-primary"
              }`}
          >
            <Scramble text={cat} />
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={onClear}
          className="px-3 py-1 rounded-full text-xs font-medium text-text-muted
                     hover:text-text-secondary transition-colors cursor-pointer"
        >
          Clear ✕
        </button>
      )}
    </div>
  );
}
