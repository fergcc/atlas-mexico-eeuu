import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { CausalityCorridor } from "@/components/charts/causality-corridor";
import { EvidenceGrid } from "@/components/charts/evidence-grid";
import { ResultSummary } from "@/components/indicador/result-summary";
import { SectionDisclosure } from "@/components/ui/section-disclosure";
import { getManifest, getSectorById, getPairsBySector, getResult, getSeries, getSectors } from "@/lib/data-loader";
import { buildCorridorData, buildEvidenceRow, pairResultBadge, EVIDENCE_COLUMNS, seriesShortLabel } from "@/lib/pair-helpers";
import { formatPairLabel } from "@/lib/pair-label";
import { SectorIcon } from "@/lib/icon-map";
import regionsData from "@/data/regions.json";

export function generateStaticParams() {
  return getSectors().map((sector) => ({ sector: sector.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const { sector: sectorId } = await params;
  const sector = getSectorById(sectorId);
  return { title: sector?.label ?? "Sector" };
}

export default async function SectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector: sectorId } = await params;
  const sector = getSectorById(sectorId);
  if (!sector) notFound();

  const manifest = getManifest();
  const pairs = getPairsBySector(sectorId);
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));
  const resultsByPairId = Object.fromEntries(pairs.map((p) => [p.pair_id, getResult(p.pair_id)]));
  const corridorPairs = buildCorridorData(pairs, manifest.series_catalog, resultsByPairId, manifest.sectors);
  const evidenceRows = pairs.map((p) =>
    buildEvidenceRow(p, resultsByPairId[p.pair_id], formatPairLabel(seriesById.get(p.series_a), seriesById.get(p.series_b)))
  );
  const relatedCorridors = regionsData.corridors.filter((c) => c.sector_id === sectorId);

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <Breadcrumbs items={[{ label: "Sectores", href: "/sectores" }, { label: sector.label }]} />

        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SectorIcon icon={sector.icon} size={24} aria-hidden="true" />
          </span>
          <PageHeader
            eyebrow={sector.priority === "strategic" ? "Sector estratégico" : "Sector de referencia"}
            title={sector.label}
            description={`${pairs.length} ${pairs.length === 1 ? "par evaluado" : "pares evaluados"} entre México y Estados Unidos para este sector, a nivel ${Array.from(new Set(pairs.map((p) => p.level))).join(", ") || "n/d"}.`}
          />
        </div>

        {relatedCorridors.length > 0 && (
          <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-foreground-muted">
              Este sector tiene {relatedCorridors.length === 1 ? "un corredor territorial" : `${relatedCorridors.length} corredores territoriales`} asociado en el Atlas.
            </p>
            <Link href="/regiones" className="text-sm font-medium text-primary hover:underline">
              Ver corredores →
            </Link>
          </GlassPanel>
        )}

        {pairs.length === 0 ? (
          <EmptyState
            title="Sin pares todavía"
            description="El pipeline no ha generado pares para este sector en el manifiesto actual."
          />
        ) : (
          <>
            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Corredor de causalidad</h2>
              <CausalityCorridor pairs={corridorPairs} variant="detail" />
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Tablero de evidencia</h2>
              <EvidenceGrid columns={EVIDENCE_COLUMNS} rows={evidenceRows} />
            </GlassPanel>

            <div className="flex flex-col gap-4">
              {pairs.map((pair) => {
                const seriesA = seriesById.get(pair.series_a);
                const seriesB = seriesById.get(pair.series_b);
                const result = resultsByPairId[pair.pair_id];
                const badge = result ? pairResultBadge(result) : null;

                return (
                  <GlassPanel key={pair.pair_id} className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge tone="primary">{pair.level}</Badge>
                        </div>
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
                            sectorLabel={sector.label}
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
          </>
        )}
      </Container>
    </Section>
  );
}
