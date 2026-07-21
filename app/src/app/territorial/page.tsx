"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Section } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { DataQualityBadge } from "@/components/ui/data-quality-badge";
import { GeneratedAtBadge } from "@/components/ui/generated-at-badge";
import { DataProvenance } from "@/components/ui/data-provenance";
import { IndicatorMatrix } from "@/components/territorial/indicator-matrix";
import { IndicatorFilter } from "@/components/territorial/indicator-filter";
import { IndicatorDetail } from "@/components/territorial/indicator-detail";
import { CsvExport } from "@/components/territorial/csv-export";
import {
  fetchIndicatorCatalog,
  fetchTerritorialIndicators,
} from "@/lib/territory-client";
import type { IndicatorCatalog, IndicatorCatalogEntry } from "@/lib/territory-client";
import { fetchManifest } from "@/lib/client-data";
import type { Manifest } from "@/lib/types";

const COUNTRIES = [
  { code: "MX", label: "México" },
  { code: "US", label: "Estados Unidos" },
  { code: "CA", label: "Canadá" },
];

interface ThemeGroup { id: string; name: string; count: number }
interface RegionEntry { region_code: string; region_name: string }
type IndicatorMap = Record<string, Record<string, number>>;

export default function TerritorialPage() {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? "";
  const [catalog, setCatalog] = useState<IndicatorCatalog | null>(null);
  const [rawValues, setRawValues] = useState<Record<string, string | number | null>[]>([]);
  const [rawDataQuality, setRawDataQuality] = useState<Record<string, string>>({});
  const [rawNote, setRawNote] = useState<Record<string, string>>({});
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(false);

  const [country, setCountry] = useState("MX");

  const indicators = useMemo<IndicatorCatalogEntry[]>(() => catalog?.indicators ?? [], [catalog]);
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());

  const [detailIndicator, setDetailIndicator] = useState<IndicatorCatalogEntry | null>(null);
  const [detailValue, setDetailValue] = useState<number | null>(null);
  const [detailRegion, setDetailRegion] = useState("");

  useEffect(() => {
    fetchManifest().then(setManifest);
  }, []);

  useEffect(() => {
    fetchIndicatorCatalog().then((c) => {
      if (c) {
        setCatalog(c);
        const allThemes = new Set<string>();
        c.indicators.forEach((i) => allThemes.add(i.subtheme));
        setSelectedThemes(allThemes);
      }
    });
  }, []);

  const loadTerritorial = useCallback(() => {
    setLoading(true);
    // Territorial indicators are general state-level attributes, not
    // sector-specific — "all" is a fixed label, not a live filter.
    fetchTerritorialIndicators(country, "all").then((data) => {
      const qualityMap: Record<string, string> = {};
      const noteMap: Record<string, string> = {};
      setRawValues(data?.raw_values.map((v) => {
        qualityMap[v.indicator_id] = v.data_quality ?? "unknown";
        noteMap[v.indicator_id] = v.note ?? "";
        return {
        country: v.country,
        region_code: v.region_code,
        region_name: v.region_name,
        indicator_id: v.indicator_id,
        indicator_name: v.indicator_name,
        value: v.value,
        unit: v.unit,
        phase: v.phase,
      }}) ?? []);
      setRawDataQuality(qualityMap);
      setRawNote(noteMap);
      setGeneratedAt(data?.generated_at ?? null);
      setLoading(false);
    });
  }, [country]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTerritorial();
  }, [loadTerritorial]);

  const themes = useMemo<ThemeGroup[]>(() => {
    const count = new Map<string, number>();
    indicators.forEach((i) => {
      count.set(i.subtheme, (count.get(i.subtheme) ?? 0) + 1);
    });
    return Array.from(count.entries()).map(([id, c]) => ({ id, name: id, count: c }));
  }, [indicators]);

  const filteredIds = useMemo(() => {
    return indicators
      .filter((i) => {
        if (selectedPhase !== "all" && i.phase !== selectedPhase) return false;
        if (!selectedThemes.has(i.subtheme)) return false;
        return true;
      })
      .map((i) => i.id);
  }, [indicators, selectedPhase, selectedThemes]);

  const indicatorNames = useMemo(() => {
    const m: Record<string, string> = {};
    indicators.forEach((i) => { m[i.id] = i.name; });
    return m;
  }, [indicators]);

  const indicatorPhases = useMemo(() => {
    const m: Record<string, string> = {};
    indicators.forEach((i) => { m[i.id] = i.phase; });
    return m;
  }, [indicators]);

  const data = useMemo<IndicatorMap>(() => {
    const m: IndicatorMap = {};
    rawValues.forEach((v) => {
      const rc = String(v.region_code ?? "");
      const iid = String(v.indicator_id ?? "");
      const val = typeof v.value === "number" ? v.value : 0;
      if (!m[rc]) m[rc] = {};
      m[rc][iid] = val;
    });
    return m;
  }, [rawValues]);

  const indicatorSources = useMemo(() => {
    const sources: Record<string, string> = {};
    for (const [indId, note] of Object.entries(rawNote)) {
      sources[indId] = note || (rawDataQuality[indId] ?? "mock");
    }
    return sources;
  }, [rawNote, rawDataQuality]);

  const regions = useMemo<RegionEntry[]>(() => {
    const seen = new Set<string>();
    const result: RegionEntry[] = [];
    rawValues.forEach((v) => {
      const rc = String(v.region_code ?? "");
      if (!seen.has(rc)) {
        seen.add(rc);
        result.push({ region_code: rc, region_name: String(v.region_name ?? rc) });
      }
    });
    return result;
  }, [rawValues]);

  function handleCellClick(indicatorId: string, _regionCode: string, value: number, regionName: string) {
    const ind = indicators.find((i) => i.id === indicatorId);
    setDetailIndicator(ind ?? null);
    setDetailValue(value);
    setDetailRegion(regionName);
  }

  return (
    <Section className="pt-10">
      <Container>
        <PageHeader
          title="Indicadores territoriales"
          description="Matriz de los 34 indicadores del Atlas Prospectivo Territorial-Industrial: Fase A (atributos urbanos) y Fase B (diagnóstico socioambiental) por región."
          meta={
            generatedAt && (
              <>
                <GeneratedAtBadge iso={generatedAt} />
                {manifest && (
                  <DataProvenance
                    generatedAt={generatedAt}
                    refreshCadence={manifest.refresh_cadence}
                    mode={manifest.mode}
                  />
                )}
              </>
            )
          }
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
            <div className="flex items-center gap-2">
              <DataQualityBadge
                variant="dot"
                real={Object.values(rawDataQuality).filter((q) => q === "real").length}
                total={Object.keys(rawDataQuality).length}
              />
              {engineUrl && (
                <button
                  onClick={loadTerritorial}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-glass px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
                >
                  {loading ? "⟳" : "⟳ Actualizar"}
                </button>
              )}
              <CsvExport
                data={rawValues}
                filename={`${country}_indicadores_territoriales.csv`}
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
                <DataQualityBadge
                  real={Object.values(rawDataQuality).filter((q) => q === "real").length}
                  total={Object.keys(rawDataQuality).length}
                />
              </div>
              <IndicatorMatrix
                regions={regions}
                indicatorIds={filteredIds}
                indicatorNames={indicatorNames}
                indicatorPhases={indicatorPhases}
                indicatorSources={indicatorSources}
                dataQuality={rawDataQuality}
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
