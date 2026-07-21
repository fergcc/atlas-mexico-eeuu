import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { ResultSummary } from "@/components/indicador/result-summary";
import { SectionDisclosure } from "@/components/ui/section-disclosure";
import { getManifest, getPairsByStateCode, getResult, getSeries, getSectorById } from "@/lib/data-loader";
import { pairResultBadge, seriesShortLabel } from "@/lib/pair-helpers";
import { MX_STATES, getMxStateBySlug } from "@/data/mx-states";

export function generateStaticParams() {
  return MX_STATES.map((state) => ({ estado: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ estado: string }> }): Promise<Metadata> {
  const { estado } = await params;
  const state = getMxStateBySlug(estado);
  return { title: state ? state.name : "Estado" };
}

export default async function EstadoPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado } = await params;
  const state = getMxStateBySlug(estado);
  if (!state) notFound();

  const manifest = getManifest();
  const pairs = getPairsByStateCode(state.code);
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <Breadcrumbs items={[{ label: "Estatal", href: "/estatal" }, { label: state.name }]} />

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mx/10 text-mx">
            <MapPin size={22} aria-hidden="true" />
          </span>
          <PageHeader
            eyebrow={`Clave INEGI ${state.code}`}
            title={state.name}
            description={
              state.border
                ? "Estado fronterizo con Estados Unidos — mayor probabilidad de encadenamientos productivos directos (maquila, cadenas de suministro transfronterizas)."
                : "Estado no fronterizo — la relación con la producción de EEUU, si existe, opera de forma más indirecta (cadenas de proveeduría, no colindancia física)."
            }
          />
        </div>

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
                        <Badge tone="muted" className="text-[10px]">{seriesA.proxy_type === "output_index" ? "producción" : "empleo"}</Badge>
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
