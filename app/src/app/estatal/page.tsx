import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { CountrySwitcher } from "@/components/estatal/country-switcher";
import { getManifest } from "@/lib/data-loader";
import { buildSectorStateDatasets } from "@/lib/pair-helpers";

export const metadata: Metadata = { title: "Estatal" };

export default function EstatalPage() {
  const manifest = getManifest();
  const mxDatasets = buildSectorStateDatasets(manifest, "MX");
  const usDatasets = buildSectorStateDatasets(manifest, "US");
  const caDatasets = buildSectorStateDatasets(manifest, "CA");

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Nivel estatal"
          title="Mapa de los estados"
          description="Elige un país y un sector para ver el valor más reciente del indicador estatal o la fuerza de la evidencia de causalidad de Granger frente a su contraparte."
          meta={<GeneratedAtBadge iso={manifest.generated_at} />}
        />
        <Suspense fallback={<p className="text-sm text-foreground-muted">Cargando mapa…</p>}>
          <CountrySwitcher
            mxDatasets={mxDatasets}
            usDatasets={usDatasets}
            caDatasets={caDatasets}
          />
        </Suspense>
      </Container>
    </Section>
  );
}
