import Link from "next/link";
import { ArrowRight, TrendingUp, Map as MapIcon, Factory, GitCompare, Layers } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { Badge } from "@/components/ui/badge";
import { GrangerGraph } from "@/components/charts/granger-graph";
import { getManifest, getPairsByLevel, getResult } from "@/lib/data-loader";
import { buildGrangerGraphData } from "@/lib/pair-helpers";
import { SectorIcon } from "@/lib/icon-map";
import { formatDateLong } from "@/lib/formatters";

export default function HomePage() {
  const manifest = getManifest();
  const nationalPairs = getPairsByLevel("nacional");
  const resultsByPairId = Object.fromEntries(
    manifest.pairs.map((p) => [p.pair_id, getResult(p.pair_id)])
  );

  const significantCount = Object.values(resultsByPairId).filter(
    (r) => r && !r.insufficient_data && (r.granger.a_causes_b.significant || r.granger.b_causes_a.significant)
  ).length;

  const { nodes, edges } = buildGrangerGraphData(nationalPairs, manifest.series_catalog, resultsByPairId);

  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Badge tone="primary" className="mb-5">
                {manifest.mode === "mock" ? "Datos de demostración" : "Datos en vivo"} · actualización{" "}
                {manifest.refresh_cadence}
              </Badge>
              <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                ¿Qué tan conectada está la industria de México con la de Estados Unidos?
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-muted">
                Un dashboard abierto que extiende el Atlas Prospectivo 2021 con dos preguntas que el
                original no respondía: ¿la producción de un país{" "}
                <em className="not-italic text-foreground">anticipa</em> la del otro (causalidad de
                Granger), y se mueven juntas en el largo plazo (cointegración)?
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/nacional"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong"
                >
                  Ver panorama nacional <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/metodologia"
                  className="inline-flex items-center gap-2 rounded-full border border-border-glass px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
                >
                  Cómo se calcula
                </Link>
              </div>
              <p className="mt-6 text-xs text-foreground-muted">
                Última generación de datos: {formatDateLong(manifest.generated_at)}. Ver{" "}
                <Link href="/metodologia" className="underline underline-offset-2 hover:text-foreground">
                  metodología
                </Link>{" "}
                para umbrales de significancia y limitaciones.
              </p>
            </div>

            <GlassPanel className="p-6">
              <div className="mb-4 grid grid-cols-3 gap-4">
                <KpiStat label="Sectores" value={manifest.sectors.length} tone="primary" />
                <KpiStat label="Pares evaluados" value={manifest.pairs.length} tone="mx" />
                <KpiStat label="Relaciones con causalidad" value={significantCount} tone="us" />
              </div>
              <div className="rounded-xl border border-border-glass p-2">
                <p className="mb-2 px-2 pt-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Vista previa · causalidad nacional
                </p>
                <GrangerGraph nodes={nodes} edges={edges} height={220} />
              </div>
            </GlassPanel>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="mb-6 font-display text-xl font-semibold text-foreground">Explora por nivel</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard href="/nacional">
              <TrendingUp className="mb-3 text-primary" size={22} aria-hidden="true" />
              <p className="font-display text-base font-semibold text-foreground">Nacional</p>
              <p className="mt-1 text-sm text-foreground-muted">
                Causalidad y cointegración agregada México–EEUU.
              </p>
            </GlassCard>
            <GlassCard href="/estatal">
              <MapIcon className="mb-3 text-mx" size={22} aria-hidden="true" />
              <p className="font-display text-base font-semibold text-foreground">Estatal</p>
              <p className="mt-1 text-sm text-foreground-muted">Mapa interactivo de los 32 estados.</p>
            </GlassCard>
            <GlassCard href="/sectores">
              <Factory className="mb-3 text-us" size={22} aria-hidden="true" />
              <p className="font-display text-base font-semibold text-foreground">Sectores</p>
              <p className="mt-1 text-sm text-foreground-muted">Fichas por sector estratégico SCIAN/NAICS.</p>
            </GlassCard>
            <GlassCard href="/comparativa">
              <GitCompare className="mb-3 text-accent" size={22} aria-hidden="true" />
              <p className="font-display text-base font-semibold text-foreground">Comparativa</p>
              <p className="mt-1 text-sm text-foreground-muted">Compara cualquier par de series lado a lado.</p>
            </GlassCard>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Sectores cubiertos</h2>
            <Link href="/sectores" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manifest.sectors.map((sector) => {
              return (
                <GlassCard key={sector.id} href={`/sectores/${sector.id}`}>
                  <div className="flex items-start justify-between">
                    <SectorIcon icon={sector.icon} className="mb-3 text-primary" size={22} aria-hidden="true" />
                    {sector.priority === "strategic" && <Badge tone="accent">Estratégico</Badge>}
                  </div>
                  <p className="font-display text-base font-semibold text-foreground">{sector.label}</p>
                </GlassCard>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <GlassPanel className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Layers className="mt-1 text-primary" size={26} aria-hidden="true" />
              <div>
                <p className="font-display text-lg font-semibold text-foreground">
                  ¿Y los corredores industriales del Atlas 2021?
                </p>
                <p className="mt-1 max-w-xl text-sm text-foreground-muted">
                  Los cinco corredores territoriales originales (aeroespacial del noreste,
                  farmacéutico La Laguna–Culiacán, agroindustrial del sureste, petroquímico de
                  Tamaulipas y siderúrgico) están disponibles como tablas agregadas por grupo de
                  estados.
                </p>
              </div>
            </div>
            <Link
              href="/regiones"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border-glass px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/5"
            >
              Ver regiones <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </GlassPanel>
        </Container>
      </Section>
    </>
  );
}
