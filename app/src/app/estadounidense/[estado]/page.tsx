import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { CausalityCorridor } from "@/components/charts/causality-corridor";
import { EvidenceGrid } from "@/components/charts/evidence-grid";
import { ResultSummary } from "@/components/indicador/result-summary";
import { SectionDisclosure } from "@/components/ui/section-disclosure";
import { StateIndicatorSummary } from "@/components/territorial/state-indicator-summary";
import { getManifest, getPairsByStateCode, getResult, getSeries, getSectorById, getTerritorialByRegion } from "@/lib/data-loader";
import { buildCorridorData, buildEvidenceRow, pairResultBadge, EVIDENCE_COLUMNS, seriesShortLabel } from "@/lib/pair-helpers";
import { US_STATES, getUsStateBySlug } from "@/data/us-states";

export function generateStaticParams() {
  return US_STATES.map((state) => ({ estado: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ estado: string }> }): Promise<Metadata> {
  const { estado } = await params;
  const state = getUsStateBySlug(estado);
  return { title: state ? state.name : "Estado" };
}

export default async function EstadoUSPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado } = await params;
  const state = getUsStateBySlug(estado);
  if (!state) notFound();

  const manifest = getManifest();
  const pairs = getPairsByStateCode(state.fips);
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));
  const resultsByPairId = Object.fromEntries(pairs.map((p) => [p.pair_id, getResult(p.pair_id)]));
  const corridorPairs = buildCorridorData(pairs, manifest.series_catalog, resultsByPairId, manifest.sectors);
  const evidenceRows = pairs.map((p) => {
    const sector = getSectorById(p.sector_id);
    return buildEvidenceRow(p, resultsByPairId[p.pair_id], sector?.label ?? p.sector_id);
  });
  const territorialValues = getTerritorialByRegion(state.fips, "US");

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <Breadcrumbs items={[{ label: "Estadounidense", href: "/estadounidense" }, { label: state.name }]} />

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-us/10 text-us">
            <MapPin size={22} aria-hidden="true" />
          </span>
          <PageHeader
            eyebrow={`FIPS ${state.fips}`}
            title={state.name}
            description={
              state.border_mx
                ? "Estado fronterizo con México — mayor probabilidad de encadenamientos productivos directos (maquila, cadenas de suministro transfronterizas)."
                : "Estado no fronterizo — la relación con la producción de México, si existe, opera de forma más indirecta (cadenas de proveeduría, no colindancia física)."
            }
            meta={<GeneratedAtBadge iso={manifest.generated_at} />}
          />
        </div>

        {territorialValues.length > 0 && (
          <GlassPanel className="p-6">
            <SectionDisclosure summary={`Indicadores territoriales de ${state.name}`} defaultOpen>
              <StateIndicatorSummary values={territorialValues} />
            </SectionDisclosure>
          </GlassPanel>
        )}

        {pairs.length >= 2 && (
          <GlassPanel className="p-4 sm:p-5">
            <p className="mb-3 px-0.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Panorama · causalidad de {state.name} por sector
            </p>
            <CausalityCorridor pairs={corridorPairs} variant="overview" />
          </GlassPanel>
        )}

        {pairs.length >= 2 && (
          <GlassPanel className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Tablero de evidencia</h2>
            <EvidenceGrid columns={EVIDENCE_COLUMNS} rows={evidenceRows} />
          </GlassPanel>
        )}

        {pairs.length === 0 ? (
          <EmptyState
            title={`Aún no hay datos para ${state.name}`}
            description="Este estado no aparece todavía en ningún par del manifiesto. Es esperado si el pipeline aún no ha cubierto esta entidad para ningún sector."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {pairs.map((pair) => {
              const sector = getSectorById(pair.sector_id);
              const seriesA = seriesById.get(pair.series_a);
              const seriesB = seriesById.get(pair.series_b);
              const result = getResult(pair.pair_id);
              const badge = result ? pairResultBadge(result) : null;

              return (
                <GlassPanel key={pair.pair_id} className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Badge tone="primary" className="mb-1">
                        {sector?.label ?? pair.sector_id}
                      </Badge>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {seriesA?.nombre} vs. {seriesB?.nombre}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {badge ? (
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      ) : (
                        <Badge tone="neutral">Resultado aún no disponible</Badge>
                      )}
                      {seriesA && (
                        <Badge tone="neutral" className="text-[10px]">{seriesA.proxy_type === "output_index" ? "producción" : "empleo"}</Badge>
                      )}
                      {seriesA && (
                        <FreshnessBadge
                          periodicidad={seriesA.periodicidad}
                          ultima_actualizacion={seriesA.ultima_actualizacion}
                          proxima_actualizacion_estimada={seriesA.proxima_actualizacion_estimada}
                          referenceIso={manifest.generated_at}
                        />
                      )}
                    </div>
                  </div>

                  {result ? (
                    <SectionDisclosure summary="Ver análisis completo de este par" className="mt-4" defaultOpen>
                      <TimeSeriesChart
                        seriesA={getSeries(pair.series_a)}
                        seriesB={getSeries(pair.series_b)}
                        labelA={seriesShortLabel(seriesA)}
                        labelB={seriesShortLabel(seriesB)}
                        unitA={seriesA?.unidad}
                        unitB={seriesB?.unidad}
                      />

                      <div className="mt-6">
                        <ResultSummary
                          result={result}
                          pair={pair}
                          seriesA={seriesA}
                          seriesB={seriesB}
                          labelA={seriesShortLabel(seriesA)}
                          labelB={seriesShortLabel(seriesB)}
                          sectorLabel={sector?.label}
                        />
                      </div>
                    </SectionDisclosure>
                  ) : (
                    <div className="mt-4">
                      <EmptyState title="Resultado aún no disponible" />
                    </div>
                  )}
                </GlassPanel>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
