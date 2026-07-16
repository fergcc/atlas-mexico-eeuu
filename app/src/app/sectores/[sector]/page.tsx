import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { GrangerGraph } from "@/components/charts/granger-graph";
import { CointegrationHeatmap } from "@/components/charts/cointegration-heatmap";
import { ResultSummary } from "@/components/indicador/result-summary";
import { getManifest, getSectorById, getPairsBySector, getResult, getSeries, getSectors } from "@/lib/data-loader";
import { buildGrangerGraphData, buildHeatmapRow, HEATMAP_COLUMNS, seriesShortLabel } from "@/lib/pair-helpers";
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
  const { nodes, edges } = buildGrangerGraphData(pairs, manifest.series_catalog, resultsByPairId);
  const heatmapRows = pairs.map((p) => buildHeatmapRow(p, resultsByPairId[p.pair_id], p.level));
  const relatedCorridors = regionsData.corridors.filter((c) => c.sector_id === sectorId);

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
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
              Este sector tiene {relatedCorridors.length === 1 ? "un corredor territorial" : `${relatedCorridors.length} corredores territoriales`} asociado en el Atlas 2021.
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
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Mapa de causalidad</h2>
              <GrangerGraph nodes={nodes} edges={edges} height={Math.max(240, nodes.length * 40)} />
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Evidencia por par</h2>
              <CointegrationHeatmap columns={HEATMAP_COLUMNS} rows={heatmapRows} />
            </GlassPanel>

            <div className="flex flex-col gap-8">
              {pairs.map((pair) => {
                const seriesA = seriesById.get(pair.series_a);
                const seriesB = seriesById.get(pair.series_b);
                const result = resultsByPairId[pair.pair_id];

                return (
                  <GlassPanel key={pair.pair_id} className="p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge tone="primary">{pair.level}</Badge>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-foreground">
                          {seriesA?.nombre} vs. {seriesB?.nombre}
                        </h3>
                      </div>
                      {seriesA && (
                        <FreshnessBadge
                          periodicidad={seriesA.periodicidad}
                          ultima_actualizacion={seriesA.ultima_actualizacion}
                          proxima_actualizacion_estimada={seriesA.proxima_actualizacion_estimada}
                          referenceIso={manifest.generated_at}
                        />
                      )}
                    </div>

                    <TimeSeriesChart
                      seriesA={getSeries(pair.series_a)}
                      seriesB={getSeries(pair.series_b)}
                      labelA={seriesShortLabel(seriesA)}
                      labelB={seriesShortLabel(seriesB)}
                      unitA={seriesA?.unidad}
                      unitB={seriesB?.unidad}
                    />

                    <div className="mt-6">
                      {result ? (
                        <ResultSummary
                          result={result}
                          pair={pair}
                          seriesA={seriesA}
                          seriesB={seriesB}
                          labelA={seriesShortLabel(seriesA)}
                          labelB={seriesShortLabel(seriesB)}
                        />
                      ) : (
                        <EmptyState title="Resultado aún no disponible" />
                      )}
                    </div>
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
