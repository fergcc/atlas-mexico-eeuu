"use client";

import { MouseEvent } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";

interface IndicatorDetailProps {
  indicator: {
    id: string;
    name: string;
    name_en: string;
    phase: string;
    theme: string;
    subtheme: string;
    unit: string;
    methodology: string;
    source: string;
    polarity: string;
    standardization: string;
    source_variables: string[];
    notes: string;
  } | null;
  value: number | null;
  regionName: string;
  onClose: () => void;
}

export function IndicatorDetail({
  indicator,
  value,
  regionName,
  onClose,
}: IndicatorDetailProps) {
  if (!indicator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <GlassPanel
        strong
        className="m-4 max-h-[80vh] w-full max-w-lg overflow-auto p-6"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {indicator.name}
            </p>
            <p className="text-sm text-foreground-muted">{indicator.name_en}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        {value !== null && (
          <div className="mb-4 rounded-xl bg-surface-glass px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Valor en {regionName}
            </p>
            <p className="font-mono-data text-2xl font-semibold tabular-nums text-foreground">
              {value.toFixed(2)} <span className="text-base font-normal text-foreground-muted">{indicator.unit}</span>
            </p>
          </div>
        )}

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-foreground">Fase</dt>
            <dd className="text-foreground-muted">Fase {indicator.phase} — {indicator.subtheme}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Metodología</dt>
            <dd className="text-foreground-muted">{indicator.methodology}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Fuente</dt>
            <dd className="text-foreground-muted">{indicator.source}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Variables</dt>
            <dd className="text-foreground-muted">{indicator.source_variables.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Estandarización</dt>
            <dd className="text-foreground-muted">{indicator.standardization} ({indicator.polarity === "positive" ? "mayor = mejor" : indicator.polarity === "negative" ? "menor = mejor" : "neutral"})</dd>
          </div>
          {indicator.notes && (
            <div>
              <dt className="font-medium text-foreground">Notas</dt>
              <dd className="leading-relaxed text-foreground-muted">{indicator.notes}</dd>
            </div>
          )}
        </dl>
      </GlassPanel>
    </div>
  );
}
