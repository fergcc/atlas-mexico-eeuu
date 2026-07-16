import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EstatalExplorer } from "@/components/estatal/estatal-explorer";
import { getManifest } from "@/lib/data-loader";
import { buildSectorStateDatasets } from "@/lib/pair-helpers";

export const metadata: Metadata = { title: "Estatal" };

export default function EstatalPage() {
  const manifest = getManifest();
  const datasets = buildSectorStateDatasets(manifest);

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Nivel estatal"
          title="Mapa de los 32 estados"
          description="Elige un sector para ver el valor más reciente del indicador estatal (ITAEE u otro proxy de producción/empleo) o la fuerza de la evidencia de causalidad de Granger frente a su contraparte en Estados Unidos."
        />
        <Suspense fallback={<p className="text-sm text-foreground-muted">Cargando mapa…</p>}>
          <EstatalExplorer datasets={datasets} />
        </Suspense>
      </Container>
    </Section>
  );
}
