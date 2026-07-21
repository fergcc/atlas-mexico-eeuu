import type { Metadata } from "next";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { Sparkline } from "@/components/charts/sparkline";
import { getManifest, getPairsBySector, getResult, getSeries } from "@/lib/data-loader";
import { SectorIcon } from "@/lib/icon-map";

export const metadata: Metadata = { title: "Sectores" };

export default function SectoresPage() {
  const manifest = getManifest();

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow={`${manifest.sectors.length} sectores`}
          title="Sectores estratégicos"
          description="El armazón sectorial parte de los 5 sectores del Atlas prospectivo territorial-industrial de Javier Jileta-Ockholm (eólica, farmacéutica, aeroespacial, agroindustrial y petroquímica), más manufactura total como referencia. El motor de causalidad/cointegración es genérico por código SCIAN/NAICS, así que crecer a todo el árbol industrial no requiere rediseño."
          meta={<GeneratedAtBadge iso={manifest.generated_at} />}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.sectors.map((sector) => {
            const pairs = getPairsBySector(sector.id);
            const pairCount = pairs.length;
            const sigCount = pairs.filter(p => {
              const r = getResult(p.pair_id);
              return r?.granger?.a_causes_b?.significant || r?.granger?.b_causes_a?.significant;
            }).length;
            const primaryMxSeriesId = manifest.series_catalog.find(
              (s) => s.sector_id === sector.id && s.pais === "MX" && s.region_code === "NAC"
            )?.id;
            const primarySeries = primaryMxSeriesId ? getSeries(primaryMxSeriesId) : null;
            return (
              <GlassCard key={sector.id} href={`/sectores/${sector.id}`}>
                <div className="flex items-start justify-between">
                  <SectorIcon icon={sector.icon} className="mb-3 text-primary" size={24} aria-hidden="true" />
                  {sector.priority === "strategic" ? (
                    <Badge tone="accent">Estratégico</Badge>
                  ) : (
                    <Badge tone="neutral">Referencia</Badge>
                  )}
                </div>
                <p className="font-display text-lg font-semibold text-foreground">{sector.label}</p>
                <p className="mt-2 text-sm text-foreground-muted">
                  {pairCount} {pairCount === 1 ? "par" : "pares"}
                  {sigCount > 0 && (
                    <Badge tone="signal-strong" className="ml-2">{sigCount} con evidencia</Badge>
                  )}
                </p>
                {primarySeries && primarySeries.observations.length > 1 && (
                  <div className="mt-3">
                    <Sparkline observations={primarySeries.observations} color="var(--color-mx)" />
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
