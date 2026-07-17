import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Info } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Sparkline } from "@/components/charts/sparkline";
import { getManifest, getSeriesCatalogEntry, getSeries, getPairs, getSectorById } from "@/lib/data-loader";
import { formatDateLong, formatNumber } from "@/lib/formatters";
import { formatPairLabel } from "@/lib/pair-label";

export function generateStaticParams() {
  return getManifest().series_catalog.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getSeriesCatalogEntry(slug);
  return { title: entry?.nombre ?? "Indicador" };
}

const PROXY_TYPE_EXPLANATION: Record<string, string> = {
  output_index: "Índice de producción/actividad — mide directamente la salida industrial.",
  labor_input: "Proxy de insumo laboral (empleo/horas), no de producción — no implica que 'la producción causa la producción' sin este matiz.",
};

export default async function IndicadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getSeriesCatalogEntry(slug);
  if (!entry) notFound();

  const manifest = getManifest();
  const series = getSeries(slug);
  const relatedPairs = getPairs().filter((p) => p.series_a === slug || p.series_b === slug);
  const lastValue = series?.observations.filter((o) => o.value !== null).at(-1);
  const sector = getSectorById(entry.sector_id);

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-8">
        <Breadcrumbs
          items={
            sector
              ? [{ label: sector.label, href: `/sectores/${sector.id}` }, { label: entry.nombre }]
              : [{ label: entry.nombre }]
          }
        />

        <PageHeader
          eyebrow={`${entry.pais} · ${entry.region_code === "NAC" ? "Nacional" : entry.region_code}`}
          title={entry.nombre}
          description={PROXY_TYPE_EXPLANATION[entry.proxy_type] ?? undefined}
          actions={
            <a
              href={`/data/series/${entry.id}.json`}
              download
              className="inline-flex items-center gap-2 rounded-full border border-border-glass px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              <Download size={15} aria-hidden="true" /> Descargar JSON crudo
            </a>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <GlassPanel className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Serie completa</h2>
            {series && series.observations.length > 0 ? (
              <Sparkline
                observations={series.observations}
                color={entry.pais === "MX" ? "var(--color-mx)" : "var(--color-us)"}
              />
            ) : (
              <p className="text-sm text-foreground-muted">Sin observaciones disponibles todavía.</p>
            )}
            {lastValue && (
              <p className="mt-3 text-sm text-foreground-muted">
                Último dato: <span className="font-mono-data text-foreground">{formatNumber(lastValue.value)} {entry.unidad}</span> ({lastValue.period})
              </p>
            )}
          </GlassPanel>

          <GlassPanel className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ficha</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Unidad</dt>
                <dd className="text-right font-medium text-foreground">{entry.unidad}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Fuente</dt>
                <dd className="text-right font-medium text-foreground">{entry.fuente}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Periodicidad</dt>
                <dd className="text-right font-medium text-foreground">{entry.periodicidad}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Tipo de proxy</dt>
                <dd className="text-right">
                  <Badge tone={entry.proxy_type === "output_index" ? "mx" : "accent"}>{entry.proxy_type}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Última actualización</dt>
                <dd className="text-right font-medium text-foreground">{formatDateLong(entry.ultima_actualizacion)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <FreshnessBadge
                periodicidad={entry.periodicidad}
                ultima_actualizacion={entry.ultima_actualizacion}
                proxima_actualizacion_estimada={entry.proxima_actualizacion_estimada}
                referenceIso={manifest.generated_at}
              />
            </div>
          </GlassPanel>
        </div>

        {relatedPairs.length > 0 && (
          <GlassPanel className="p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Info size={17} className="text-primary" aria-hidden="true" /> Usada en {relatedPairs.length}{" "}
              {relatedPairs.length === 1 ? "par" : "pares"} de causalidad/cointegración
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedPairs.map((p) => {
                const seriesA = manifest.series_catalog.find((s) => s.id === p.series_a);
                const seriesB = manifest.series_catalog.find((s) => s.id === p.series_b);
                const sector = getSectorById(p.sector_id);
                return (
                  <Link
                    key={p.pair_id}
                    href={`/sectores/${p.sector_id}`}
                    title={p.pair_id}
                    className="rounded-full border border-border-glass px-3 py-1.5 text-sm text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
                  >
                    {formatPairLabel(seriesA, seriesB, sector?.label)}
                  </Link>
                );
              })}
            </div>
          </GlassPanel>
        )}

        <p className="text-xs text-foreground-muted">
          Ver la <Link href="/metodologia" className="underline underline-offset-2">metodología</Link> completa
          para cómo se calculan estacionariedad, causalidad y cointegración a partir de esta serie.
        </p>
      </Container>
    </Section>
  );
}
