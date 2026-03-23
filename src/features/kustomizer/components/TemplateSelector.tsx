import type { ColorTemplate } from "@/types/index.ts";

interface TemplateSelectorProps {
  templates: ColorTemplate[];
  selectedTemplate: ColorTemplate | null;
  onSelect: (template: ColorTemplate) => void;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div>
      <label
        htmlFor="template-selector"
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        Select a template
      </label>
      <select
        id="template-selector"
        className="w-full p-2.5 bg-surface-card border border-border rounded-lg
                   text-text-primary focus:border-accent focus:outline-none
                   cursor-pointer"
        value={selectedTemplate?.name ?? ""}
        onChange={(e) => {
          const template = templates.find((t) => t.name === e.target.value);
          if (template) onSelect(template);
        }}
      >
        {templates.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
        {selectedTemplate &&
          !templates.find((t) => t.name === selectedTemplate.name) && (
            <option value={selectedTemplate.name}>{selectedTemplate.name}</option>
          )}
      </select>
    </div>
  );
}
