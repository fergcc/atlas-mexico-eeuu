"use client";

import { useEffect, useMemo, useState } from "react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { IndicatorMatrix } from "@/components/territorial/indicator-matrix";
import { IndicatorFilter } from "@/components/territorial/indicator-filter";
import { IndicatorDetail } from "@/components/territorial/indicator-detail";
import { CsvExport } from "@/components/territorial/csv-export";
import {
  fetchIndicatorCatalog,
  fetchTerritorialIndicators,
} from "@/lib/territory-client";

const SECTORS = [
  { id: "manufactura_total", label: "Manufactura total" },
  { id: "aeroespacial", label: "Aeroespacial" },
  { id: "eolica", label: "Energía eólica" },
  { id: "farmaceutica", label: "Farmacéutica" },
  { id: "agroindustrial", label: "Agroindustrial" },
  { id: "petroquimica", label: "Petroquímica" },
];

const COUNTRIES = [
  { code: "MX", label: "México" },
  { code: "US", label: "Estados Unidos" },
  { code: "CA", label: "Canadá" },
];

export default function TerritorialPage() {
  const [engineUrl] = useState(process.env.NEXT_PUBLIC_ENGINE_URL ?? "");
  const [catalog, setCatalog] = useState<any>(null);
  const [rawValues, setRawValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [country, setCountry] = useState("MX");
  const [sector, setSector] = useState("manufactura_total");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());

  const [detailIndicator, setDetailIndicator] = useState<any>(null);
  const [detailValue, setDetailValue] = useState<number | null>(null);
  const [detailRegion, setDetailRegion] = useState("");

  useEffect(() => {
    fetchIndicatorCatalog().then((c) => {
      if (c) {
        setCatalog(c);
        const allThemes = new Set<string>();
        c.indicators.forEach((i: any) => allThemes.add(i.subtheme));
        setSelectedThemes(allThemes);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTerritorialIndicators(country, sector).then((data) => {
      setRawValues(data?.raw_values ?? []);
      setLoading(false);
    });
  }, [country, sector]);

  const indicators = catalog?.indicators ?? [];

  const themes = useMemo(() => {
    const count = new Map<string, number>();
    indicators.forEach((i: any) => {
      count.set(i.subtheme, (count.get(i.subtheme) ?? 0) + 1);
    });
    return Array.from(count.entries()).map(([id, c]) => ({ id, name: id, count: c }));
  }, [indicators]);

  const filteredIds = useMemo(() => {
    return indicators
      .filter((i: any) => {
        if (selectedPhase !== "all" && i.phase !== selectedPhase) return false;
        if (!selectedThemes.has(i.subtheme)) return false;
        return true;
      })
      .map((i: any) => i.id);
  }, [indicators, selectedPhase, selectedThemes]);

  const indicatorNames = useMemo(() => {
    const m: Record<string, string> = {};
    indicators.forEach((i: any) => { m[i.id] = i.name; });
    return m;
  }, [indicators]);

  const indicatorPhases = useMemo(() => {
    const m: Record<string, string> = {};
    indicators.forEach((i: any) => { m[i.id] = i.phase; });
    return m;
  }, [indicators]);

  const data = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    rawValues.forEach((v: any) => {
      if (!m[v.region_code]) m[v.region_code] = {};
      m[v.region_code][v.indicator_id] = v.value;
    });
    return m;
  }, [rawValues]);

  const regions = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ region_code: string; region_name: string }> = [];
    rawValues.forEach((v: any) => {
      if (!seen.has(v.region_code)) {
        seen.add(v.region_code);
        result.push({ region_code: v.region_code, region_name: v.region_name });
      }
    });
    return result;
  }, [rawValues]);

  const csvData = useMemo(() => {
    return rawValues.map((v: any) => ({
      country: v.country,
      region_code: v.region_code,
      region_name: v.region_name,
      indicator_id: v.indicator_id,
      indicator_name: v.indicator_name,
      value: v.value,
      unit: v.unit,
      phase: v.phase,
    }));
  }, [rawValues]);

  function handleCellClick(indicatorId: string, _regionCode: string, value: number, regionName: string) {
    const ind = indicators.find((i: any) => i.id === indicatorId);
    setDetailIndicator(ind ?? null);
    setDetailValue(value);
    setDetailRegion(regionName);
  }

  if (!engineUrl) {
    return (
      <Section className="pt-10">
        <Container>
          <PageHeader
            title="Indicadores territoriales"
            description="Matriz de los 34 indicadores del Atlas Prospectivo Territorial-Industrial por región."
          />
          <GlassPanel className="p-8 text-center">
            <p className="text-foreground-muted">
              Configura <code className="font-mono-data text-primary">NEXT_PUBLIC_ENGINE_URL</code> en tu .env para conectar al Engine del Atlas.
            </p>
          </GlassPanel>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="pt-10">
      <Container>
        <PageHeader
          title="Indicadores territoriales"
          description="Matriz de los 34 indicadores del Atlas Prospectivo Territorial-Industrial: Fase A (atributos urbanos) y Fase B (diagnóstico socioambiental) por región."
        />

        <GlassPanel className="mb-6 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">País</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-xl border border-border-glass bg-surface-glass px-3 py-2 text-sm text-foreground"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="rounded-xl border border-border-glass bg-surface-glass px-3 py-2 text-sm text-foreground"
              >
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <CsvExport
                data={csvData}
                filename={`${country}_${sector}_indicadores.csv`}
                className="inline-flex items-center gap-2 rounded-full border border-border-glass px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              />
            </div>
          </div>
        </GlassPanel>

        {catalog && (
          <div className="mb-4">
            <IndicatorFilter
              selectedPhase={selectedPhase}
              onPhaseChange={setSelectedPhase}
              selectedThemes={selectedThemes}
              onThemeToggle={(theme) => {
                const next = new Set(selectedThemes);
                if (next.has(theme)) next.delete(theme);
                else next.add(theme);
                setSelectedThemes(next);
              }}
              themes={themes}
            />
          </div>
        )}

        <GlassPanel className="p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-foreground-muted">
              Cargando matriz de indicadores...
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-xs text-foreground-muted">
                <span>{regions.length} regiones</span>
                <span>·</span>
                <span>{filteredIds.length} indicadores</span>
                <span>·</span>
                <span>{rawValues.length} valores</span>
                <span>·</span>
                <span className="rounded-full bg-signal-neutral/10 px-2 py-0.5 text-signal-neutral">
                  Datos sintéticos
                </span>
              </div>
              <IndicatorMatrix
                regions={regions}
                indicatorIds={filteredIds}
                indicatorNames={indicatorNames}
                indicatorPhases={indicatorPhases}
                data={data}
                onCellClick={handleCellClick}
              />
            </>
          )}
        </GlassPanel>
      </Container>

      {detailIndicator && (
        <IndicatorDetail
          indicator={detailIndicator}
          value={detailValue}
          regionName={detailRegion}
          onClose={() => setDetailIndicator(null)}
        />
      )}
    </Section>
  );
}
