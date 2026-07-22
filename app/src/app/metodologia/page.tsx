import type { Metadata } from "next";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { DataProvenance } from "@/components/ui/data-provenance";
import { getManifest } from "@/lib/data-loader";

export const metadata: Metadata = { title: "Metodología" };

function PipelineModule({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel id={id} className="scroll-mt-20 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono-data text-sm font-semibold text-primary">
          {n}
        </span>
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{children}</p>
    </GlassPanel>
  );
}

const PIPELINE_MODULES = [
  { id: "preprocesamiento", n: "1", title: "Preprocesamiento" },
  { id: "granger", n: "2", title: "Causalidad de Granger" },
  { id: "cointegracion", n: "3", title: "Cointegración" },
  { id: "correccion-multiple", n: "4", title: "Corrección por comparaciones múltiples" },
  { id: "comparabilidad-mx-eeuu", n: "5", title: "Comparabilidad estatal MX–EEUU" },
  { id: "umbral-observaciones", n: "6", title: "Umbral mínimo de observaciones" },
] as const;

export default function MetodologiaPage() {
  const manifest = getManifest();

  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Transparencia metodológica"
          title="Cómo se calcula lo que ves en este sitio"
          description="Este dashboard extiende el Atlas prospectivo territorial-industrial para la atracción de inversiones, de Javier Jileta-Ockholm (Scientika, 2025), con una capa de causalidad de Granger y cointegración que el libro original no incluía. Ambas capas se documentan aquí sin tecnicismos ocultos."
        />

        <GlassPanel className="border-accent/30 p-6">
          <p className="flex items-center gap-2 font-medium text-accent">Aclaración importante</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            El Atlas prospectivo territorial-industrial original de Javier Jileta-Ockholm{" "}
            <strong className="text-foreground">no usa</strong> causalidad de
            Granger ni cointegración. Su metodología se basó en Ventaja Comparativa Revelada, matriz
            insumo-producto y análisis shift-share, con datos de corte transversal de 2019. Este sitio toma
            de ese libro únicamente el armazón sectorial (5 sectores estratégicos SCIAN) y territorial
            (corredores multi-estado), y construye desde cero, como <strong className="text-foreground">extensión propia</strong>,
            la capa de series de tiempo, causalidad y cointegración que se muestra en{" "}
            <span className="font-mono-data">/nacional</span>, <span className="font-mono-data">/estatal</span> y{" "}
            <span className="font-mono-data">/sectores</span>.
          </p>
        </GlassPanel>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Pipeline econométrico</h2>
            <nav aria-label="Módulos del pipeline econométrico" className="mt-3">
              <ol className="flex flex-col gap-1 text-sm text-foreground-muted sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
                {PIPELINE_MODULES.map((step) => (
                  <li key={step.id}>
                    <a href={`#${step.id}`} className="text-primary hover:underline">
                      {step.n}. {step.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <PipelineModule id="preprocesamiento" n="1" title="Preprocesamiento">
            Se usan series ajustadas por estacionalidad cuando existen (nunca se mezclan series SA y NSA en
            una misma prueba), se aplica transformación logarítmica y se prueba estacionariedad con ADF
            (<code className="font-mono-data">adfuller</code>) y KPSS como confirmación. Las series se
            diferencian hasta alcanzar I(1)/I(2) según se requiera.
          </PipelineModule>
          <PipelineModule id="granger" n="2" title="Causalidad de Granger">
            Se ajusta un VAR (<code className="font-mono-data">statsmodels.tsa.api.VAR</code>) con el
            orden elegido por AIC/BIC, y se prueba causalidad en ambas direcciones. El resultado se
            clasifica como unidireccional, bidireccional o ausente.
          </PipelineModule>
          <PipelineModule id="cointegracion" n="3" title="Cointegración">
            Engle-Granger (<code className="font-mono-data">coint</code>) se usa como filtro rápido por
            par; Johansen (<code className="font-mono-data">coint_johansen</code>) es el resultado
            autoritativo para sistemas multivariados. Cuando hay cointegración, se ajusta un VECM y se
            extrae el vector de cointegración y la velocidad de ajuste.
          </PipelineModule>
          <PipelineModule id="correccion-multiple" n="4" title="Corrección por comparaciones múltiples">
            Como se corren muchos pares industria×región, todos los p-values de una misma corrida se
            corrigen con FDR de Benjamini-Hochberg (<code className="font-mono-data">multipletests</code>).
            El sitio siempre muestra el p-value ajustado junto al crudo.
          </PipelineModule>
          <PipelineModule id="comparabilidad-mx-eeuu" n="5" title="Comparabilidad estatal MX–EEUU">
            El ITAEE (trimestral, México) se compara contra empleo/horas manufactureras de BLS (mensual,
            agregado a trimestral). Como FRED no tiene producción industrial por estado en EEUU, el mejor
            proxy disponible ahí es un insumo laboral, no producción — cada resultado declara
            explícitamente <span className="font-mono-data">proxy_type: &quot;output_index&quot;</span> o{" "}
            <span className="font-mono-data">&quot;labor_input&quot;</span> para no insinuar una relación
            output-output que no existe.
          </PipelineModule>
          <PipelineModule id="umbral-observaciones" n="6" title="Umbral mínimo de observaciones">
            Si el número de observaciones cae debajo de un mínimo razonable, el par se marca como{" "}
            <span className="font-mono-data">insufficient_data</span> en vez de reportar un estadístico
            espurio.
          </PipelineModule>
        </div>

        <GlassPanel className="p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Umbrales de significancia</h2>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Un resultado se marca <Badge tone="signal-strong">Sí, hay evidencia clara</Badge> cuando el
            p-value ajustado por FDR es menor a 0.05. Los resultados no significativos nunca se ocultan — se
            muestran con un círculo hueco en vez de relleno en el corredor de causalidad y el tablero de
            evidencia, para dejar claro que la prueba se corrió y no encontró evidencia suficiente, en vez de
            simplemente omitir esa relación.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Cadencia de actualización</h2>
          <p className="text-sm leading-relaxed text-foreground-muted">
            El pipeline corre trimestralmente, sincronizado con el calendario real de publicación de INEGI,
            Banxico, FRED, BEA y BLS. No existe granularidad semanal real en ninguna fuente relevante — el
            ITAEE y el PIB estatal (PIBE) se publican con 90–120 días de rezago tras el cierre del
            trimestre, así que una cadencia semanal no aportaría dato nuevo la mayoría de las semanas. El
            badge de frescura en cada indicador siempre refleja la periodicidad real de esa serie específica.
          </p>
          <div className="mt-4 border-t border-border-glass pt-4">
            <DataProvenance
              generatedAt={manifest.generated_at}
              refreshCadence={manifest.refresh_cadence}
              mode={manifest.mode}
              variant="static"
            />
          </div>
        </GlassPanel>
      </Container>
    </Section>
  );
}
