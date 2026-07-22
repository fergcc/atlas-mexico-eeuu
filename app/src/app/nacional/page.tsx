import type { Metadata } from "next";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { DataProvenance } from "@/components/ui/data-provenance";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { CausalityCorridor } from "@/components/charts/causality-corridor";
import { EvidenceGrid } from "@/components/charts/evidence-grid";
import { ResultSummary } from "@/components/indicador/result-summary";
import { SectionDisclosure } from "@/components/ui/section-disclosure";
import { getManifest, getPairsByLevel, getResult, getSeries, getSectorById } from "@/lib/data-loader";
import { buildCorridorData, buildEvidenceGroups, pairResultBadge, seriesShortLabel } from "@/lib/pair-helpers";
import type { BadgeTone } from "@/components/ui/badge";

function countryBadgeTone(pais: string | undefined): BadgeTone {
  return pais === "MX" ? "mx" : pais === "CA" ? "ca" : "us";
}

export const metadata: Metadata = { title: "Nacional" };

export default function NacionalPage() {
  const manifest = getManifest();
  const pairs = getPairsByLevel("nacional");
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));

  const resultsByPairId = Object.fromEntries(pairs.map((p) => [p.pair_id, getResult(p.pair_id)]));
  const corridorPairs = buildCorridorData(pairs, manifest.series_catalog, resultsByPairId, manifest.sectors);
  const evidenceGroups = buildEvidenceGroups(pairs, manifest.series_catalog, resultsByPairId, (p) => {
    const sector = getSectorById(p.sector_id);
    return sector?.label ?? p.sector_id;
  });

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Nivel nacional"
          title="Causalidad y cointegración agregada México–EEUU–Canadá"
          description="Compara el índice de producción manufacturera nacional de México contra los índices de producción industrial de Estados Unidos y Canadá, sector por sector, con las mismas pruebas econométricas para todo el árbol SCIAN/NAICS."
          meta={
            <>
              <GeneratedAtBadge iso={manifest.generated_at} />
              <DataProvenance
                generatedAt={manifest.generated_at}
                refreshCadence={manifest.refresh_cadence}
                mode={manifest.mode}
              />
            </>
          }
        />

        {pairs.length === 0 ? (
          <EmptyState
            title="Aún no hay pares a nivel nacional"
            description="El manifiesto no declara ningún par con level = 'nacional'. Esto es esperado si el pipeline todavía no ha corrido para este nivel."
          />
        ) : (
          <>
            <GlassPanel className="p-4 sm:p-5">
              <p className="mb-3 px-0.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Panorama · los {corridorPairs.length} sectores nacionales de un vistazo
              </p>
              <CausalityCorridor pairs={corridorPairs} variant="overview" />
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Corredor de causalidad — sector por sector
              </h2>
              <CausalityCorridor pairs={corridorPairs} variant="detail" />
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Tablero de evidencia por sector
              </h2>
              <div className="flex flex-col gap-6">
                {evidenceGroups.map((group) => (
                  <div key={group.key}>
                    {evidenceGroups.length > 1 && (
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                        {group.heading}
                      </p>
                    )}
                    <EvidenceGrid columns={group.columns} rows={group.rows} />
                  </div>
                ))}
              </div>
            </GlassPanel>

            {(() => {
              const total = pairs.length;
              const significant = Object.values(resultsByPairId).filter(
                r => r && !r.insufficient_data && (r.granger?.a_causes_b?.significant || r.granger?.b_causes_a?.significant)
              ).length;
              const coint = Object.values(resultsByPairId).filter(
                r => r && r.cointegration_engle_granger?.cointegrated
              ).length;
              return (
                <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
                  <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs">
                    <strong className="text-foreground">{total}</strong> pares evaluados
                  </span>
                  <span className="rounded-full bg-success/10 px-3 py-1.5 text-xs text-success">
                    <strong>{significant}</strong> con evidencia de causalidad
                  </span>
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs text-accent">
                    <strong>{coint}</strong> cointegrados
                  </span>
                </div>
              );
            })()}

            <div className="flex flex-col gap-4">
              {pairs.map((pair) => {
                const sector = getSectorById(pair.sector_id);
                const seriesA = seriesById.get(pair.series_a);
                const seriesB = seriesById.get(pair.series_b);
                const result = resultsByPairId[pair.pair_id];
                const seriesFileA = getSeries(pair.series_a);
                const seriesFileB = getSeries(pair.series_b);
                const badge = result ? pairResultBadge(result) : null;

                return (
                  <GlassPanel key={pair.pair_id} className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-foreground">
                          {sector?.label ?? pair.sector_id}
                          {seriesB?.pais === "CA" && (
                            <span className="ml-2 text-xs font-normal text-foreground-muted">CA</span>
                          )}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {seriesA?.nombre} vs. {seriesB?.nombre}
                        </p>
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
                      <SectionDisclosure summary="Ver análisis completo de este par" className="mt-4">
                        <div className="mb-6 flex flex-wrap gap-2">
                          {seriesA && <Badge tone={countryBadgeTone(seriesA.pais)}>{seriesA.proxy_type}</Badge>}
                          {seriesB && <Badge tone={countryBadgeTone(seriesB.pais)}>{seriesB.proxy_type}</Badge>}
                        </div>

                        <TimeSeriesChart
                          seriesA={seriesFileA}
                          seriesB={seriesFileB}
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
                        <EmptyState
                          title="Resultado aún no disponible"
                          description="Aún no hay resultado para este par — se genera en la próxima actualización trimestral."
                        />
                      </div>
                    )}
                  </GlassPanel>
                );
              })}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
