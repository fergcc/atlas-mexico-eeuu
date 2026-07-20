"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface IndicatorMatrixProps {
  regions: Array<{ region_code: string; region_name: string }>;
  indicatorIds: string[];
  indicatorNames: Record<string, string>;
  indicatorPhases: Record<string, string>;
  indicatorSources: Record<string, string>;
  dataQuality: Record<string, string>;
  data: Record<string, Record<string, number>>;
  onCellClick: (indicatorId: string, regionCode: string, value: number, regionName: string) => void;
  className?: string;
}

function colorForValue(value: number, polarity: string): string {
  if (polarity === "positive") {
    if (value > 70) return "bg-success/20 text-success";
    if (value > 50) return "bg-success/10 text-success/80";
    if (value > 30) return "bg-warning/10 text-accent";
    return "bg-danger/10 text-danger";
  }
  if (polarity === "negative") {
    if (value < 30) return "bg-success/20 text-success";
    if (value < 50) return "bg-success/10 text-success/80";
    if (value < 70) return "bg-warning/10 text-accent";
    return "bg-danger/10 text-danger";
  }
  return "bg-foreground/5 text-foreground-muted";
}

export function IndicatorMatrix({
  regions,
  indicatorIds,
  indicatorNames,
  indicatorPhases,
  indicatorSources,
  dataQuality,
  data,
  onCellClick,
  className,
}: IndicatorMatrixProps) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (indicatorId: string) => {
    if (sortBy === indicatorId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(indicatorId);
      setSortDir("desc");
    }
  };

  const sortedRegions = sortBy
    ? [...regions].sort((a, b) => {
        const va = data[a.region_code]?.[sortBy] ?? 0;
        const vb = data[b.region_code]?.[sortBy] ?? 0;
        return sortDir === "asc" ? va - vb : vb - va;
      })
    : regions;

  if (!regions.length || !indicatorIds.length) {
    return (
      <div className="py-8 text-center text-sm text-foreground-muted">
        Selecciona un país, un sector y al menos un tema para ver la matriz.
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto", className)}>
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface-glass-strong px-3 py-2 text-left font-medium text-foreground backdrop-blur-sm">
              Región
            </th>
            {indicatorIds.map((id) => (
              <th
                key={id}
                className="cursor-pointer whitespace-nowrap px-2 py-2 text-center font-medium text-foreground-muted hover:text-foreground"
                onClick={() => handleSort(id)}
                title={indicatorNames[id]}
              >
                <span className="block text-[10px] uppercase tracking-wide">
                  {indicatorPhases[id] === "A" ? "A" : "B"}
                </span>
                <span className="block max-w-[80px] truncate">{indicatorNames[id]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRegions.map((region, ri) => (
            <tr
              key={region.region_code}
              className={cn(
                "border-t border-border-glass/50",
                ri % 2 === 0 && "bg-foreground/[0.02]"
              )}
            >
              <td className="sticky left-0 z-10 bg-surface-glass-strong px-3 py-2 font-medium text-foreground backdrop-blur-sm">
                {region.region_name}
              </td>
              {indicatorIds.map((id) => {
                const value = data[region.region_code]?.[id];
                const hasValue = value !== undefined && value !== null;
                const isMock = dataQuality?.[id] !== "real";
                const source = indicatorSources?.[id] ?? (isMock ? "mock" : "real");
                return (
                  <td
                    key={id}
                    className={cn(
                      "cursor-pointer px-2 py-2 text-center tabular-nums transition-colors hover:ring-1 hover:ring-primary/30",
                      hasValue
                        ? isMock
                          ? "text-foreground/30 italic"
                          : colorForValue(value, "positive")
                        : "text-foreground/20"
                    )}
                    title={`${indicatorNames[id]}\n${source}${isMock ? " (mock)" : ""}`}
                    onClick={() => {
                      if (hasValue) {
                        onCellClick(id, region.region_code, value, region.region_name);
                      }
                    }}
                  >
                    {hasValue ? value.toFixed(0) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
