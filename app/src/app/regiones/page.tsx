import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { ChoroplethMap } from "@/components/charts/choropleth-map";
import { getManifest, getPairsByStateCode, getResult } from "@/lib/data-loader";
import { getMxStateByCode } from "@/data/mx-states";
import { significanceLabel } from "@/lib/formatters";
import { grangerPlainLabel } from "@/lib/plain-language";
import regionsData from "@/data/regions.json";

export const metadata: Metadata = { title: "Regiones" };

export default function RegionesPage() {
  const manifest = getManifest();
  const sectorLabel = new Map(manifest.sectors.map((s) => [s.id, s.label]));
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Vista simple · agregados por grupo de estados"
          title="Corredores industriales"
          description="Los 5 corredores territoriales multi-municipio del Atlas prospectivo territorial-industrial de Javier Jileta-Ockholm, tratados aquí como tablas agregadas por grupo de estados. El mapa municipal detallado de cada corredor queda para una fase posterior."
          meta={<GeneratedAtBadge iso={manifest.generated_at} />}
        />

        <div className="flex flex-col gap-6">
          {regionsData.corridors.map((corridor) => {
            const states = corridor.mx_state_codes.map((code) => getMxStateByCode(code)).filter(Boolean);
            const rows = corridor.mx_state_codes.flatMap((code) => {
              const pairs = getPairsByStateCode(code).filter((p) => p.sector_id === corridor.sector_id);
              return pairs.map((pair) => {
                const result = getResult(pair.pair_id);
                const state = getMxStateByCode(code);
                const mxEntry = [pair.series_a, pair.series_b].map((id) => seriesById.get(id)).find((s) => s?.pais === "MX");
                return { code, state, pair, result, mxEntry };
              });
            });

            const mapValues = Object.fromEntries(
              rows
                .filter((r) => r.result && !r.result.insufficient_data)
                .map((r) => [r.code, r.result?.granger.a_causes_b.significant ? 1 : 0.4])
            );

            return (
              <GlassPanel key={corridor.id} className="p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge tone="primary" className="mb-2">
                      {sectorLabel.get(corridor.sector_id) ?? corridor.sector_id}
                    </Badge>
                    <h2 className="font-display text-xl font-semibold text-foreground">{corridor.label}</h2>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {states
                    .filter((s) => s && rows.some((r) => r.code === s.code))
                    .map(
                      (s) =>
                        s && (
                          <Link
                            key={s.code}
                            href={`/estatal/${s.slug}`}
                            className="rounded-full border border-border-glass px-3 py-1 text-xs text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
                          >
                            {s.name}
                            {s.border && <span className="ml-1 text-us">·frontera</span>}
                          </Link>
                        )
                    )}
                </div>

                {rows.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    Aún no hay resultados con datos suficientes para los estados de este corredor.
                  </p>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-start">
                    <ChoroplethMap values={mapValues} height={280} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-foreground-muted">
                            <th className="pb-2 pr-4 font-medium">Estado</th>
                            <th className="pb-2 pr-4 font-medium">Serie MX</th>
                            <th className="pb-2 pr-4 font-medium">Causalidad →EEUU</th>
                            <th className="pb-2 font-medium">Cointegración</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(({ code, state, pair, result, mxEntry }) => (
                            <tr key={pair.pair_id} className="border-t border-border-glass">
                              <td className="py-2 pr-4">
                                <Link href={state ? `/estatal/${state.slug}` : "#"} className="hover:underline">
                                  {state?.name ?? code}
                                </Link>
                              </td>
                              <td className="py-2 pr-4 text-foreground-muted">{mxEntry?.nombre ?? "s/d"}</td>
                              <td className="py-2">
                                {result && !result.insufficient_data ? (
                                  <Badge
                                    tone={result.granger.a_causes_b.significant ? "signal-strong" : "signal-neutral"}
                                    className="cursor-default"
                                    title={significanceLabel(
                                      result.granger.a_causes_b.p_value_fdr_adj,
                                      result.granger.a_causes_b.significant
                                    )}
                                  >
                                    {grangerPlainLabel(result.granger.a_causes_b.significant)}
                                  </Badge>
                                ) : (
                                  <span className="text-foreground-muted">Sin resultado aún</span>
                                )}
                              </td>
                              <td className="py-2">
                                {result && !result.insufficient_data && result.cointegration_engle_granger?.cointegrated ? (
                                  <Badge tone="signal-neutral" className="cursor-default">
                                    Sí
                                  </Badge>
                                ) : result?.insufficient_data ? (
                                  <span className="text-foreground-muted">—</span>
                                ) : (
                                  <span className="text-xs text-foreground-muted">no</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
