import type { Metadata } from "next";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { getManifest, getPairsBySector } from "@/lib/data-loader";
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
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.sectors.map((sector) => {
            const pairCount = getPairsBySector(sector.id).length;
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
                  {pairCount} {pairCount === 1 ? "par evaluado" : "pares evaluados"}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
