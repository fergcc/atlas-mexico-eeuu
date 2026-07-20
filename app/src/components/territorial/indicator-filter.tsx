"use client";

import { cn } from "@/lib/cn";

interface IndicatorFilterProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  selectedThemes: Set<string>;
  onThemeToggle: (theme: string) => void;
  themes: Array<{ id: string; name: string; count: number }>;
  className?: string;
}

const THEME_NAMES: Record<string, string> = {
  industrial_concentration_foreign_capital: "Concentración industrial",
  innovation_human_capital_personnel: "Innovación y capital humano",
  local_government_capacity_industry_problems: "Gobierno y burocracia",
  employment_characterization: "Empleo",
  mobility: "Movilidad",
  housing_conditions: "Vivienda",
  basic_services_extreme_poverty: "Servicios y pobreza",
  social_problems: "Problemas sociales",
  environmental_perspectives: "Medio ambiente",
};

export function IndicatorFilter({
  selectedPhase,
  onPhaseChange,
  selectedThemes,
  onThemeToggle,
  themes,
  className,
}: IndicatorFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-1 rounded-full border border-border-glass p-0.5">
        <button
          type="button"
          onClick={() => onPhaseChange("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            selectedPhase === "all"
              ? "bg-primary/10 text-primary"
              : "text-foreground-muted hover:text-foreground"
          )}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onPhaseChange("A")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            selectedPhase === "A"
              ? "bg-primary/10 text-primary"
              : "text-foreground-muted hover:text-foreground"
          )}
        >
          Fase A
        </button>
        <button
          type="button"
          onClick={() => onPhaseChange("B")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            selectedPhase === "B"
              ? "bg-primary/10 text-primary"
              : "text-foreground-muted hover:text-foreground"
          )}
        >
          Fase B
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {themes.map((t) => {
          const active = selectedThemes.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onThemeToggle(t.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border-glass text-foreground-muted hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {THEME_NAMES[t.id] ?? t.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
