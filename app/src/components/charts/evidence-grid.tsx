"use client";

import { Fragment, useState } from "react";
import { Check } from "lucide-react";
import { cointegrationColor, COINTEGRATION_STOPS } from "@/lib/color-scales";
import { formatPValue } from "@/lib/formatters";
import { cn } from "@/lib/cn";

export interface EvidenceCell {
  key: string;
  strength: number; // 0-1, e.g. 1 - p_value_fdr_adj (clipped)
  significant: boolean;
  pValue: number | null;
  insufficientData?: boolean;
}

export interface EvidenceRow {
  id: string;
  label: string;
  cells: EvidenceCell[];
}

interface EvidenceGridProps {
  columns: string[];
  rows: EvidenceRow[];
}

/**
 * "Tablero de evidencia" — replaces the old `CointegrationHeatmap`, whose
 * SVG `<text>` labels had no reflow mechanism (fixed `cellSize`, manual
 * 26-char slice on row labels, nothing at all on column headers) and
 * overflowed into neighboring cells at the column widths this data needs.
 *
 * CSS Grid instead of SVG: every column reserves real space via
 * `minmax(...)`, and every label is a `<div>` that wraps/reflows within its
 * own cell — it can never bleed into a neighboring column, at any viewport.
 * Each cell is a real `<button>` (focusable, semantic) that expands a
 * full-width plain-language explanation below its row instead of relying on
 * an SVG `<title>` tooltip nobody can reach by keyboard.
 */
export function EvidenceGrid({ columns, rows }: EvidenceGridProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Aún no hay resultados de cointegración para mostrar en esta selección.
      </p>
    );
  }

  const templateColumns = `minmax(160px, 1.4fr) repeat(${columns.length}, minmax(104px, 1fr))`;

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-fit gap-2"
          style={{ gridTemplateColumns: templateColumns }}
          role="table"
          aria-label="Tablero de evidencia de causalidad y cointegración"
        >
          <div aria-hidden="true" />
          {columns.map((col) => (
            <div
              key={col}
              className="min-w-0 self-end text-pretty px-1 pb-1.5 text-center text-xs font-medium leading-tight text-foreground-muted"
            >
              {col}
            </div>
          ))}

          {rows.map((row) => {
            const expandedCell = row.cells.find((c) => c.key === expandedKey);
            return (
              <Fragment key={row.id}>
                <div className="flex min-w-0 items-center text-pretty pr-2 text-sm font-medium leading-snug text-foreground">
                  {row.label}
                </div>
                {row.cells.map((cell, ci) => {
                  const expanded = cell.key === expandedKey;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={expanded ? `${cell.key}-detail` : undefined}
                      onClick={() => setExpandedKey(expanded ? null : cell.key)}
                      style={{
                        backgroundColor: cell.insufficientData ? undefined : `${cointegrationColor(cell.strength)}26`,
                      }}
                      className={cn(
                        "flex min-h-[52px] items-center justify-center rounded-xl border px-2 py-2 transition-colors",
                        expanded
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border-glass hover:border-foreground/25",
                        cell.insufficientData && "bg-background-elevated"
                      )}
                    >
                      <EvidenceCellIcon cell={cell} columnLabel={columns[ci]} />
                    </button>
                  );
                })}
                {expandedCell && (
                  <div
                    id={`${expandedCell.key}-detail`}
                    style={{ gridColumn: "1 / -1" }}
                    className="rounded-xl border border-border-glass bg-foreground/[0.03] px-4 py-3 text-sm leading-relaxed text-foreground-muted"
                  >
                    {evidencePhrase(expandedCell, columns[row.cells.findIndex((c) => c.key === expandedKey)])}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-signal-strong bg-signal-strong text-white">
            <Check size={11} aria-hidden="true" />
          </span>
          <span>Evidencia clara</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-signal-neutral" aria-hidden="true" />
          <span>Sin evidencia suficiente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border border-dashed border-foreground-muted/70" aria-hidden="true" />
          <span>Datos insuficientes (s/d)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Menor evidencia</span>
          <span
            className="h-2.5 w-20 rounded-full"
            style={{ background: `linear-gradient(to right, ${COINTEGRATION_STOPS.map((s) => s.hex).join(", ")})` }}
            aria-hidden="true"
          />
          <span>Mayor evidencia</span>
        </div>
      </div>
    </div>
  );
}

function EvidenceCellIcon({ cell, columnLabel }: { cell: EvidenceCell; columnLabel: string }) {
  if (cell.insufficientData) {
    return (
      <span className="flex flex-col items-center gap-1 text-foreground-muted" title="Datos insuficientes">
        <span className="h-3.5 w-3.5 rounded-full border border-dashed border-foreground-muted/70" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">s/d</span>
      </span>
    );
  }
  if (cell.significant) {
    return (
      <span className="flex flex-col items-center gap-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-signal-strong bg-signal-strong text-white">
          <Check size={13} aria-hidden="true" />
        </span>
        <span className="sr-only">{`${columnLabel}: evidencia clara`}</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="h-4 w-4 rounded-full border-2 border-signal-neutral" aria-hidden="true" />
      <span className="sr-only">{`${columnLabel}: sin evidencia suficiente`}</span>
    </span>
  );
}

function evidencePhrase(cell: EvidenceCell, columnLabel?: string): string {
  if (cell.insufficientData) {
    return "Datos insuficientes para un estadístico confiable en este par — no se reporta un resultado para no sugerir una conclusión espuria.";
  }
  const pAdj = `p ajustada (FDR) = ${formatPValue(cell.pValue)}`;
  if (columnLabel?.toLowerCase().includes("cointegr")) {
    return cell.significant
      ? `Sí, hay evidencia de que ambas series se mueven juntas en el largo plazo (${pAdj}).`
      : `No hay evidencia suficiente de que ambas series se muevan juntas en el largo plazo (${pAdj}).`;
  }
  return cell.significant
    ? `Sí, hay evidencia clara de que esta serie anticipa a la otra (${pAdj}).`
    : `No hay evidencia suficiente de que esta serie anticipe a la otra (${pAdj}).`;
}
