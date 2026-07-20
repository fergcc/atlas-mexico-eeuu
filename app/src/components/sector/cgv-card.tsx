"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, TrendingUp, DollarSign } from "lucide-react";
import type { SectorAnalysisData } from "@/lib/engine-client";

interface CgvProps {
  sector: string;
  data: SectorAnalysisData | null;
  className?: string;
}

interface WbIndicator { value?: number; year?: string }
interface EciItem { economic_complexity_index?: number }
interface PatentItem { patent_count?: number }

export function CgvCard({ sector, data, className }: CgvProps) {
  if (!data) return null;

  const wb = (data.world_bank ?? {}) as Record<string, WbIndicator>;
  const eci = (data.economic_complexity ?? {}) as EciItem;
  const innovation = (data.innovation ?? {}) as PatentItem;

  return (
    <GlassPanel className={className}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Globe size={18} className="text-primary" aria-hidden="true" />
        Análisis global — {sector}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <DollarSign size={12} className="inline" aria-hidden="true" /> PIB
          </p>
          <p className="mt-1 font-mono-data text-xl tabular-nums text-foreground">
            {wb.gdp_current_usd?.value != null
              ? `$${(wb.gdp_current_usd.value / 1e9).toFixed(1)}B`
              : "—"}
          </p>
          <p className="text-xs text-foreground-muted">
            {wb.gdp_current_usd?.year ?? ""}
          </p>
        </div>

        <div className="rounded-xl bg-surface-glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Building2 size={12} className="inline" aria-hidden="true" /> Manufactura
          </p>
          <p className="mt-1 font-mono-data text-xl tabular-nums text-foreground">
            {wb.manufacturing_gdp_pct?.value != null
              ? `${wb.manufacturing_gdp_pct.value.toFixed(1)}%`
              : "—"}
          </p>
          <p className="text-xs text-foreground-muted">del PIB</p>
        </div>

        <div className="rounded-xl bg-surface-glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <TrendingUp size={12} className="inline" aria-hidden="true" /> Crecimiento
          </p>
          <p className="mt-1 font-mono-data text-xl tabular-nums text-foreground">
            {wb.gdp_growth?.value != null
              ? `${wb.gdp_growth.value.toFixed(1)}%`
              : "—"}
          </p>
          <p className="text-xs text-foreground-muted">{wb.gdp_growth?.year ?? ""}</p>
        </div>

        <div className="rounded-xl bg-surface-glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            I+D (% PIB)
          </p>
          <p className="mt-1 font-mono-data text-xl tabular-nums text-foreground">
            {wb.research_pct_gdp?.value != null
              ? `${wb.research_pct_gdp.value.toFixed(2)}%`
              : "—"}
          </p>
          <p className="text-xs text-foreground-muted">{wb.research_pct_gdp?.year ?? ""}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {eci?.economic_complexity_index != null && (
          <Badge tone="accent">Complejidad económica: {eci.economic_complexity_index.toFixed(2)}</Badge>
        )}
        {innovation?.patent_count != null && (
          <Badge tone="primary">{innovation.patent_count.toLocaleString()} patentes</Badge>
        )}
        {wb.fdi_pct?.value != null && (
          <Badge tone="neutral">IED: {wb.fdi_pct.value.toFixed(1)}% PIB</Badge>
        )}
      </div>
    </GlassPanel>
  );
}
