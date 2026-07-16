import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ComparativaClient } from "@/components/comparativa/comparativa-client";
import { getManifest } from "@/lib/data-loader";

export const metadata: Metadata = { title: "Comparativa" };

export default function ComparativaPage() {
  const manifest = getManifest();

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Herramienta libre"
          title="Comparativa México vs. Estados Unidos"
          description="Elige cualquier par de series del catálogo — no tienen que pertenecer al mismo sector o par precalculado — para verlas superpuestas. Útil para explorar hipótesis antes de esperar a que el pipeline las evalúe formalmente."
        />
        <Suspense fallback={<p className="text-sm text-foreground-muted">Cargando comparativa…</p>}>
          <ComparativaClient catalog={manifest.series_catalog} />
        </Suspense>
      </Container>
    </Section>
  );
}
