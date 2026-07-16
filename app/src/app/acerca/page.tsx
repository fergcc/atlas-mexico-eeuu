import type { Metadata } from "next";
import { Code2, Scale, HeartHandshake, Database } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";

export const metadata: Metadata = { title: "Acerca" };

export default function AcercaPage() {
  return (
    <Section className="pt-10">
      <Container className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Código abierto"
          title="Acerca del proyecto"
          description="Atlas México–EEUU es un proyecto independiente, de código abierto, que cualquiera puede clonar, correr localmente y desplegar sin infraestructura de pago."
        />

        <GlassPanel className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Scale size={18} className="text-primary" aria-hidden="true" /> Licencia
          </h2>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Este proyecto se distribuye bajo la licencia MIT. Puedes usar, copiar, modificar y redistribuir
            el código libremente, incluso con fines comerciales, siempre que conserves el aviso de
            copyright y la licencia original.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Database size={18} className="text-mx" aria-hidden="true" /> Fuentes de datos
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground-muted">
            <li>INEGI (API de Indicadores/BIE) — ITAEE, EMIM, PIBE, comercio exterior por entidad</li>
            <li>Banxico SIE — tipo de cambio FIX, indicadores de comercio</li>
            <li>FRED (St. Louis Fed) — Industrial Production Index nacional y por NAICS</li>
            <li>BEA — PIB por estado e industria (EEUU)</li>
            <li>BLS — empleo/horas manufactureras por estado (EEUU)</li>
          </ul>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <HeartHandshake size={18} className="text-us" aria-hidden="true" /> Cómo contribuir
          </h2>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Los issues y pull requests son bienvenidos: desde ampliar la cobertura sectorial (todo el árbol
            SCIAN/NAICS, no solo los 5 sectores estratégicos del Atlas 2021), hasta mejorar la geometría del
            mapa estatal (ver la nota sobre el TopoJSON placeholder en <code className="font-mono-data">/estatal</code>),
            corregir metodología o traducir la interfaz. Revisa{" "}
            <code className="font-mono-data">CONTRIBUTING.md</code> en la raíz del repositorio.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Code2 size={18} className="text-foreground" aria-hidden="true" /> Créditos
          </h2>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Basado en el armazón sectorial y territorial del{" "}
            <em>Atlas Prospectivo 2021</em> (Secretaría de Relaciones Exteriores, ONUDI y ONU-Hábitat). Este
            proyecto es independiente y no está afiliado ni respaldado por esas organizaciones. La capa de
            causalidad y cointegración es una extensión propia — ver{" "}
            <a href="/metodologia" className="underline underline-offset-2 hover:text-foreground">
              metodología
            </a>
            .
          </p>
        </GlassPanel>
      </Container>
    </Section>
  );
}
