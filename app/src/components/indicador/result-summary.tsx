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
  vecmAdjustmentNarrative,
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
          <div className="flex flex-wrap items-center gap-2">
            {granger.optimal_lag !== undefined && (
              <Badge tone="neutral" title="Número de periodos rezagados que el modelo VAR usó para esta prueba">
                rezago óptimo = {granger.optimal_lag} ({(granger.selection_criterion ?? "").toUpperCase() || "s/d"})
              </Badge>
            )}
            <Badge tone="neutral">{sample.n_obs} observaciones</Badge>
          </div>
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
              <p>Johansen (autoritativo) · rango de cointegración = {johansenRank ?? "s/d"}</p>
              {cointegration_johansen.trace_statistic && cointegration_johansen.critical_values && (
                <table className="mt-2 w-full text-left">
                  <thead>
                    <tr className="text-foreground-muted">
                      <th className="pr-3 font-normal">H0: rango ≤ r</th>
                      <th className="pr-3 font-normal">Traza</th>
                      <th className="font-normal">Crítico 95%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cointegration_johansen.trace_statistic.map((stat, r) => (
                      <tr key={r} className="border-t border-border-glass/50">
                        <td className="pr-3 py-1">r = {r}</td>
                        <td className="pr-3 py-1">{stat.toFixed(2)}</td>
                        <td className="py-1">{cointegration_johansen.critical_values?.[r]?.[1]?.toFixed(2) ?? "s/d"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TechnicalDetail>
          </div>
        </div>

        {result.vecm && (
          <div className="mt-4 rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Corrección de equilibrio (VECM)</p>
            <p className="text-sm text-foreground-muted">
              {vecmAdjustmentNarrative(labelA, labelB, result.vecm.adjustment_speed?.[0]) ??
                "El motor ajustó un VECM para este par, pero no reportó velocidad de ajuste."}
            </p>
            <TechnicalDetail className="mt-2">
              Vector de cointegración = [{result.vecm.cointegration_vector?.map((v) => v.toFixed(3)).join(", ") ?? "s/d"}] · velocidad de
              ajuste = [{result.vecm.adjustment_speed?.map((v) => v.toFixed(3)).join(", ") ?? "s/d"}]
            </TechnicalDetail>
          </div>
        )}
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
        <TechnicalDetail className="mt-3" summary="Ver detalle técnico (ADF + KPSS)">
          <ul className="flex flex-col gap-1">
            <li>
              {labelA}: orden de integración ={" "}
              {stationarity.a.order_of_integration !== undefined ? `I(${stationarity.a.order_of_integration})` : "s/d"}{" "}
              · p (ADF) = {formatPValue(stationarity.a.adf_p_value)} · p (KPSS) = {formatPValue(stationarity.a.kpss_p_value)}
              {stationarity.a.kpss_p_value !== undefined &&
                stationarity.a.adf_p_value !== undefined &&
                (stationarity.a.kpss_p_value < 0.05) === (stationarity.a.adf_p_value < 0.05) && (
                  <span className="text-danger"> · ADF y KPSS discrepan</span>
                )}
            </li>
            <li>
              {labelB}: orden de integración ={" "}
              {stationarity.b.order_of_integration !== undefined ? `I(${stationarity.b.order_of_integration})` : "s/d"}{" "}
              · p (ADF) = {formatPValue(stationarity.b.adf_p_value)} · p (KPSS) = {formatPValue(stationarity.b.kpss_p_value)}
              {stationarity.b.kpss_p_value !== undefined &&
                stationarity.b.adf_p_value !== undefined &&
                (stationarity.b.kpss_p_value < 0.05) === (stationarity.b.adf_p_value < 0.05) && (
                  <span className="text-danger"> · ADF y KPSS discrepan</span>
                )}
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
        {result.sector?.scian && (
          <>
            {" "}
            · SCIAN <span className="font-mono-data">{result.sector.scian}</span>
            {result.sector.naics && (
              <>
                {" "}
                / NAICS <span className="font-mono-data">{result.sector.naics}</span>
              </>
            )}
          </>
        )}
      </p>

      {(result.series_a?.seasonal_adjustment || result.series_b?.seasonal_adjustment || result.data_vintage_detail) && (
        <TechnicalDetail summary="Ver metadatos técnicos de las series">
          <ul className="flex flex-col gap-1">
            {result.series_a?.seasonal_adjustment && (
              <li>{labelA}: ajuste estacional = {result.series_a.seasonal_adjustment}</li>
            )}
            {result.series_b?.seasonal_adjustment && (
              <li>{labelB}: ajuste estacional = {result.series_b.seasonal_adjustment}</li>
            )}
            {result.data_vintage_detail && (
              <li>
                Vintage por serie: {labelA} = {formatDateShort(result.data_vintage_detail.a)} · {labelB} ={" "}
                {formatDateShort(result.data_vintage_detail.b)}
              </li>
            )}
          </ul>
        </TechnicalDetail>
      )}
    </div>
  );
}
