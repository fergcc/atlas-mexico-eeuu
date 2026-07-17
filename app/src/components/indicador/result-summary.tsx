import { AlertTriangle, ArrowRight, ArrowLeftRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { TechnicalDetail } from "@/components/ui/technical-detail";
import { formatPValue, formatDateShort, significanceLabel } from "@/lib/formatters";
import { formatPairLabel } from "@/lib/pair-label";
import {
  GRANGER_PLAIN_QUESTION,
  COINTEGRATION_PLAIN_QUESTION,
  COINTEGRATION_SCREENING_LABEL,
  COINTEGRATION_CONFIRMATION_LABEL,
  STATIONARITY_PLAIN_QUESTION,
  grangerPlainLabel,
  stationarityPlainLabel,
  cointegrationRankPlainLabel,
} from "@/lib/plain-language";
import type { ResultFile, PairMeta, SeriesCatalogEntry, StationarityResult } from "@/lib/types";

interface ResultSummaryProps {
  result: ResultFile;
  pair: PairMeta;
  seriesA?: SeriesCatalogEntry;
  seriesB?: SeriesCatalogEntry;
  labelA: string;
  labelB: string;
  sectorLabel?: string;
}

function StationarityRow({ label, kind }: { label: string; kind: StationarityResult }) {
  return (
    <tr className="border-t border-border-glass">
      <td className="py-2 pr-4 text-foreground-muted">{label}</td>
      <td className="py-2">
        {kind.is_stationary === undefined ? (
          "s/d"
        ) : (
          <Badge tone={kind.is_stationary ? "signal-strong" : "signal-neutral"}>
            {stationarityPlainLabel(kind.is_stationary)}
          </Badge>
        )}
      </td>
    </tr>
  );
}

export function ResultSummary({ result, pair, seriesA, seriesB, labelA, labelB, sectorLabel }: ResultSummaryProps) {
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

  const johansenRank = cointegration_johansen.cointegration_rank;

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">{GRANGER_PLAIN_QUESTION}</h3>
          <Badge tone="neutral">{sample.n_obs} observaciones</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-mx">{labelA}</span>
              <ArrowRight size={14} className="text-foreground-muted" aria-hidden="true" />
              <span className="text-us">{labelB}</span>
            </p>
            <Badge tone={granger.a_causes_b.significant ? "signal-strong" : "signal-neutral"}>
              {grangerPlainLabel(granger.a_causes_b.significant)}
            </Badge>
            <TechnicalDetail className="mt-2">
              Causalidad de Granger · F = {granger.a_causes_b.f_stat?.toFixed?.(2) ?? "s/d"} · p cruda ={" "}
              {formatPValue(granger.a_causes_b.p_value)} ·{" "}
              {significanceLabel(granger.a_causes_b.p_value_fdr_adj, granger.a_causes_b.significant)}
            </TechnicalDetail>
          </div>
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-us">{labelB}</span>
              <ArrowRight size={14} className="text-foreground-muted" aria-hidden="true" />
              <span className="text-mx">{labelA}</span>
            </p>
            <Badge tone={granger.b_causes_a.significant ? "signal-strong" : "signal-neutral"}>
              {grangerPlainLabel(granger.b_causes_a.significant)}
            </Badge>
            <TechnicalDetail className="mt-2">
              Causalidad de Granger · F = {granger.b_causes_a.f_stat?.toFixed?.(2) ?? "s/d"} · p cruda ={" "}
              {formatPValue(granger.b_causes_a.p_value)} ·{" "}
              {significanceLabel(granger.b_causes_a.p_value_fdr_adj, granger.b_causes_a.significant)}
            </TechnicalDetail>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <ArrowLeftRight size={17} className="text-primary" aria-hidden="true" /> {COINTEGRATION_PLAIN_QUESTION}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-foreground">{COINTEGRATION_SCREENING_LABEL}</p>
            <Badge tone={cointegration_engle_granger.cointegrated ? "signal-strong" : "signal-neutral"}>
              {cointegration_engle_granger.cointegrated ? "Cointegradas" : "Sin evidencia"}
            </Badge>
            <TechnicalDetail className="mt-2">
              Engle-Granger (screening) · p = {formatPValue(cointegration_engle_granger.p_value)}
            </TechnicalDetail>
          </div>
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-foreground">{COINTEGRATION_CONFIRMATION_LABEL}</p>
            <Badge tone={(johansenRank ?? 0) > 0 ? "signal-strong" : "signal-neutral"}>
              {cointegrationRankPlainLabel(johansenRank)}
            </Badge>
            <TechnicalDetail className="mt-2">
              Johansen (autoritativo) · rango de cointegración = {johansenRank ?? "s/d"}
              {result.vecm && " · VECM ajustado — velocidad de ajuste disponible en el JSON crudo del resultado."}
            </TechnicalDetail>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-3 font-display text-lg font-semibold text-foreground">{STATIONARITY_PLAIN_QUESTION}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-foreground-muted">
                <th className="pb-2 pr-4 font-medium">Serie</th>
                <th className="pb-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <StationarityRow label={labelA} kind={stationarity.a} />
              <StationarityRow label={labelB} kind={stationarity.b} />
            </tbody>
          </table>
        </div>
        <TechnicalDetail className="mt-3" summary="Ver detalle técnico (prueba ADF)">
          <ul className="flex flex-col gap-1">
            <li>
              {labelA}: orden de integración ={" "}
              {stationarity.a.order_of_integration !== undefined ? `I(${stationarity.a.order_of_integration})` : "s/d"}{" "}
              · p (ADF) = {formatPValue(stationarity.a.adf_p_value)}
            </li>
            <li>
              {labelB}: orden de integración ={" "}
              {stationarity.b.order_of_integration !== undefined ? `I(${stationarity.b.order_of_integration})` : "s/d"}{" "}
              · p (ADF) = {formatPValue(stationarity.b.adf_p_value)}
            </li>
          </ul>
        </TechnicalDetail>
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

      <p className="text-xs text-foreground-muted" title={pair.pair_id}>
        Par {formatPairLabel(seriesA, seriesB, sectorLabel)} · generado {formatDateShort(result.generated_at)} ·
        vintage de datos {formatDateShort(result.data_vintage)}
      </p>
    </div>
  );
}
