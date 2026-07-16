"use client";

import { useId } from "react";
import { cointegrationColor, COINTEGRATION_STOPS } from "@/lib/color-scales";
import { formatPValue } from "@/lib/formatters";

export interface HeatmapCell {
  key: string;
  strength: number; // 0-1, e.g. 1 - p_value_fdr_adj (clipped)
  significant: boolean;
  pValue: number | null;
  insufficientData?: boolean;
}

export interface HeatmapRow {
  id: string;
  label: string;
  cells: HeatmapCell[];
}

interface CointegrationHeatmapProps {
  columns: string[];
  rows: HeatmapRow[];
  cellSize?: number;
  rowLabelWidth?: number;
}

const CELL_GAP = 6;

/**
 * Custom SVG heatmap (no d3-scale-chromatic default palette): color encodes
 * strength of statistical evidence via `cointegrationColor`, while
 * significance is ALSO encoded structurally (diagonal hatch) so the
 * information never depends on hue perception alone.
 */
export function CointegrationHeatmap({
  columns,
  rows,
  cellSize = 56,
  rowLabelWidth = 168,
}: CointegrationHeatmapProps) {
  const hatchId = useId();
  const width = rowLabelWidth + columns.length * (cellSize + CELL_GAP);
  const headerHeight = 32;
  const height = headerHeight + rows.length * (cellSize + CELL_GAP);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Aún no hay resultados de cointegración para mostrar en esta selección.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="Mapa de calor de evidencia de causalidad y cointegración">
        <defs>
          <pattern id={hatchId} width={6} height={6} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1={0} y1={0} x2={0} y2={6} stroke="rgb(0 0 0 / 18%)" strokeWidth={2} />
          </pattern>
        </defs>

        {columns.map((col, ci) => (
          <text
            key={col}
            x={rowLabelWidth + ci * (cellSize + CELL_GAP) + cellSize / 2}
            y={headerHeight - 12}
            textAnchor="middle"
            fontSize={11}
            fill="var(--foreground-muted)"
          >
            {col}
          </text>
        ))}

        {rows.map((row, ri) => (
          <g key={row.id} transform={`translate(0, ${headerHeight + ri * (cellSize + CELL_GAP)})`}>
            <text
              x={0}
              y={cellSize / 2}
              dy="0.35em"
              fontSize={12}
              fill="var(--foreground)"
              className="font-medium"
            >
              {row.label.length > 26 ? `${row.label.slice(0, 25)}…` : row.label}
            </text>
            {row.cells.map((cell, ci) => (
              <g key={cell.key} transform={`translate(${rowLabelWidth + ci * (cellSize + CELL_GAP)}, 0)`}>
                <title>
                  {cell.insufficientData
                    ? "Datos insuficientes para un estadístico confiable"
                    : `p ajustada = ${formatPValue(cell.pValue)} · ${cell.significant ? "significativo" : "no significativo"}`}
                </title>
                <rect
                  width={cellSize}
                  height={cellSize}
                  rx={10}
                  fill={cell.insufficientData ? "var(--background-elevated)" : cointegrationColor(cell.strength)}
                  stroke="var(--border-glass)"
                />
                {!cell.significant && !cell.insufficientData && (
                  <rect width={cellSize} height={cellSize} rx={10} fill={`url(#${hatchId})`} />
                )}
                {cell.insufficientData && (
                  <text
                    x={cellSize / 2}
                    y={cellSize / 2}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={16}
                    fill="var(--foreground-muted)"
                  >
                    s/d
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <span>Evidencia débil</span>
          <span
            className="h-3 w-28 rounded-full"
            style={{
              background: `linear-gradient(to right, ${COINTEGRATION_STOPS.map((s) => s.hex).join(", ")})`,
            }}
          />
          <span>Evidencia fuerte</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative h-4 w-4 overflow-hidden rounded border border-border-glass bg-primary/30">
            <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_2px,transparent_2px,transparent_5px)]" />
          </span>
          <span>No significativo (p ajustada FDR ≥ 0.05)</span>
        </div>
      </div>
    </div>
  );
}
