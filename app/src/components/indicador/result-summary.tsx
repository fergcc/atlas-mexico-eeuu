import { AlertTriangle, ArrowRight, ArrowLeftRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { formatPValue, formatDateShort, significanceLabel } from "@/lib/formatters";
import type { ResultFile, PairMeta, SeriesCatalogEntry } from "@/lib/types";

interface ResultSummaryProps {
  result: ResultFile;
  pair: PairMeta;
  seriesA?: SeriesCatalogEntry;
  seriesB?: SeriesCatalogEntry;
  labelA: string;
  labelB: string;
}

function StationarityRow({ label, kind }: { label: string; kind: import("@/lib/types").StationarityResult }) {
  return (
    <tr className="border-t border-border-glass">
      <td className="py-2 pr-4 text-foreground-muted">{label}</td>
      <td className="py-2 pr-4">
        {kind.is_stationary === undefined ? (
          "s/d"
        ) : (
          <Badge tone={kind.is_stationary ? "success" : "accent"}>
            {kind.is_stationary ? "Estacionaria" : "No estacionaria"}
          </Badge>
        )}
      </td>
      <td className="py-2 pr-4 font-mono-data">
        {kind.order_of_integration !== undefined ? `I(${kind.order_of_integration})` : "s/d"}
      </td>
      <td className="py-2 font-mono-data">{formatPValue(kind.adf_p_value)}</td>
    </tr>
  );
}

export function ResultSummary({ result, pair, labelA, labelB }: ResultSummaryProps) {
  const { granger, cointegration_engle_granger, cointegration_johansen, stationarity, sample, warnings } = result;

  if (result.insufficient_data) {
    return (
      <GlassPanel className="p-6">
        <p className="flex items-center gap-2 font-medium text-accent">
          <AlertTriangle size={16} aria-hidden="true" /> Datos insuficientes
        </p>
        <p className="mt-2 text-sm text-foreground-muted">
          Este par ({labelA} / {labelB}) no alcanza el número mínimo de observaciones para un
          estadístico confiable ({sample?.n_obs ?? "s/d"} obs.). Se marca explícitamente en vez de
          reportar un resultado espurio.
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">Causalidad de Granger</h3>
          <Badge tone="neutral">{sample.n_obs} observaciones</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-mx">{labelA}</span>
              <ArrowRight size={14} className="text-foreground-muted" aria-hidden="true" />
              <span className="text-us">{labelB}</span>
            </p>
            <Badge tone={granger.a_causes_b.significant ? "success" : "neutral"}>
              {significanceLabel(granger.a_causes_b.p_value_fdr_adj, granger.a_causes_b.significant)}
            </Badge>
            <p className="mt-2 font-mono-data text-xs text-foreground-muted">
              F = {granger.a_causes_b.f_stat?.toFixed?.(2) ?? "s/d"} · p cruda = {formatPValue(granger.a_causes_b.p_value)}
            </p>
          </div>
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-us">{labelB}</span>
              <ArrowRight size={14} className="text-foreground-muted" aria-hidden="true" />
              <span className="text-mx">{labelA}</span>
            </p>
            <Badge tone={granger.b_causes_a.significant ? "success" : "neutral"}>
              {significanceLabel(granger.b_causes_a.p_value_fdr_adj, granger.b_causes_a.significant)}
            </Badge>
            <p className="mt-2 font-mono-data text-xs text-foreground-muted">
              F = {granger.b_causes_a.f_stat?.toFixed?.(2) ?? "s/d"} · p cruda = {formatPValue(granger.b_causes_a.p_value)}
            </p>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <ArrowLeftRight size={17} className="text-primary" aria-hidden="true" /> Cointegración
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Engle-Granger (screening)</p>
            <Badge tone={cointegration_engle_granger.cointegrated ? "success" : "neutral"}>
              {cointegration_engle_granger.cointegrated ? "Cointegradas" : "Sin evidencia"}
            </Badge>
            <p className="mt-2 font-mono-data text-xs text-foreground-muted">
              p = {formatPValue(cointegration_engle_granger.p_value)}
            </p>
          </div>
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Johansen (autoritativo)</p>
            <Badge tone={((cointegration_johansen.cointegration_rank ?? 0) > 0) ? "success" : "neutral"}>
              Rango {cointegration_johansen.cointegration_rank ?? "s/d"}
            </Badge>
          </div>
        </div>
        {result.vecm && (
          <p className="mt-3 text-xs text-foreground-muted">
            VECM ajustado — velocidad de ajuste disponible en el JSON crudo del resultado.
          </p>
        )}
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Estacionariedad (ADF)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-foreground-muted">
                <th className="pb-2 pr-4 font-medium">Serie</th>
                <th className="pb-2 pr-4 font-medium">Resultado</th>
                <th className="pb-2 pr-4 font-medium">Orden</th>
                <th className="pb-2 font-medium">p (ADF)</th>
              </tr>
            </thead>
            <tbody>
              <StationarityRow label={labelA} kind={stationarity.a} />
              <StationarityRow label={labelB} kind={stationarity.b} />
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {warnings.length > 0 && (
        <GlassPanel className="border-accent/30 p-6">
          <p className="mb-2 flex items-center gap-2 font-medium text-accent">
            <AlertTriangle size={16} aria-hidden="true" /> Advertencias del motor econométrico
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground-muted">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </GlassPanel>
      )}

      <p className="text-xs text-foreground-muted">
        Par <code className="font-mono-data">{pair.pair_id}</code> · generado {formatDateShort(result.generated_at)} ·
        vintage de datos {formatDateShort(result.data_vintage)}
      </p>
    </div>
  );
}
