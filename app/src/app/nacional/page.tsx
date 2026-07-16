import type { Metadata } from "next";
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
import { getManifest, getPairsByLevel, getResult, getSeries, getSectorById } from "@/lib/data-loader";
import { buildGrangerGraphData, buildHeatmapRow, HEATMAP_COLUMNS, seriesShortLabel } from "@/lib/pair-helpers";

export const metadata: Metadata = { title: "Nacional" };

export default function NacionalPage() {
  const manifest = getManifest();
  const pairs = getPairsByLevel("nacional");
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));

  const resultsByPairId = Object.fromEntries(pairs.map((p) => [p.pair_id, getResult(p.pair_id)]));
  const { nodes, edges } = buildGrangerGraphData(pairs, manifest.series_catalog, resultsByPairId);
  const heatmapRows = pairs.map((p) => {
    const sector = getSectorById(p.sector_id);
    return buildHeatmapRow(p, resultsByPairId[p.pair_id], sector?.label ?? p.sector_id);
  });

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Nivel nacional"
          title="Causalidad y cointegración agregada México–EEUU"
          description="Compara el índice de producción manufacturera nacional de México contra el índice de producción industrial de Estados Unidos, sector por sector, con las mismas pruebas econométricas para todo el árbol SCIAN/NAICS."
        />

        {pairs.length === 0 ? (
          <EmptyState
            title="Aún no hay pares a nivel nacional"
            description="El manifiesto no declara ningún par con level = 'nacional'. Esto es esperado si el pipeline todavía no ha corrido para este nivel."
          />
        ) : (
          <>
            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Mapa de causalidad (todos los sectores nacionales)
              </h2>
              <GrangerGraph nodes={nodes} edges={edges} height={Math.max(260, nodes.length * 40)} />
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Evidencia por sector
              </h2>
              <CointegrationHeatmap columns={HEATMAP_COLUMNS} rows={heatmapRows} />
            </GlassPanel>

            <div className="flex flex-col gap-8">
              {pairs.map((pair) => {
                const sector = getSectorById(pair.sector_id);
                const seriesA = seriesById.get(pair.series_a);
                const seriesB = seriesById.get(pair.series_b);
                const result = resultsByPairId[pair.pair_id];
                const seriesFileA = getSeries(pair.series_a);
                const seriesFileB = getSeries(pair.series_b);

                return (
                  <GlassPanel key={pair.pair_id} className="p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-foreground">
                          {sector?.label ?? pair.sector_id}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {seriesA?.nombre} vs. {seriesB?.nombre}
                        </p>
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

                    <div className="mb-6 flex flex-wrap gap-2">
                      {seriesA && <Badge tone="mx">{seriesA.proxy_type}</Badge>}
                      {seriesB && <Badge tone="us">{seriesB.proxy_type}</Badge>}
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
                        <EmptyState
                          title="Resultado aún no disponible"
                          description={`Falta data/results/${pair.pair_id}.json.`}
                        />
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
