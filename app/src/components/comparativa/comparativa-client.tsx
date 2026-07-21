"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { fetchSeries } from "@/lib/client-data";
import { seriesShortLabel } from "@/lib/series-label";
import type { SeriesCatalogEntry, SeriesFile } from "@/lib/types";

interface ComparativaClientProps {
  catalog: SeriesCatalogEntry[];
}

function CountryVarSelect({
  id,
  label,
  value,
  onChange,
  catalog,
  defaultCountry,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  catalog: SeriesCatalogEntry[];
  defaultCountry: "MX" | "US";
}) {
  const country =
    (catalog.find((s) => s.id === value)?.pais as "MX" | "US") || defaultCountry;

  const filtered = useMemo(
    () => catalog.filter((s) => s.pais === country),
    [catalog, country]
  );

  const handleCountryChange = (newCountry: "MX" | "US") => {
    const first = catalog.find((s) => s.pais === newCountry);
    if (first) onChange(first.id);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground-muted">{label}</span>
      <div className="flex gap-2">
        <select
          id={`${id}-pais`}
          name={`${id}-pais`}
          value={country}
          onChange={(e) => handleCountryChange(e.target.value as "MX" | "US")}
          className="min-w-0 flex-1 rounded-xl glass-dropdown px-3.5 py-2.5 text-sm text-foreground"
        >
          <option value="MX">México</option>
          <option value="US">Estados Unidos</option>
        </select>
        <select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-[2] rounded-xl glass-dropdown px-3.5 py-2.5 text-sm text-foreground"
        >
          <option value="">Selecciona una variable...</option>
          {filtered.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ComparativaClient({ catalog }: ComparativaClientProps) {
  const defaultA = catalog.find((s) => s.pais === "MX")?.id ?? "";
  const defaultB = catalog.find((s) => s.pais === "US")?.id ?? "";

  const [seriesAId, setSeriesAId] = useQueryState("a", parseAsString.withDefault(defaultA));
  const [seriesBId, setSeriesBId] = useQueryState("b", parseAsString.withDefault(defaultB));

  const [fetched, setFetched] = useState<{
    aId: string;
    bId: string;
    seriesA: SeriesFile | null;
    seriesB: SeriesFile | null;
  } | null>(null);

  const entryA = catalog.find((s) => s.id === seriesAId);
  const entryB = catalog.find((s) => s.id === seriesBId);
  const loading = fetched?.aId !== seriesAId || fetched?.bId !== seriesBId;

  useEffect(() => {
    let cancelled = false;
    Promise.all([seriesAId ? fetchSeries(seriesAId) : Promise.resolve(null), seriesBId ? fetchSeries(seriesBId) : Promise.resolve(null)]).then(
      ([a, b]) => {
        if (cancelled) return;
        setFetched({ aId: seriesAId, bId: seriesBId, seriesA: a, seriesB: b });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [seriesAId, seriesBId]);

  const seriesA = fetched?.aId === seriesAId ? fetched.seriesA : null;
  const seriesB = fetched?.bId === seriesBId ? fetched.seriesB : null;

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <CountryVarSelect
          id="serie-a"
          label="Serie A"
          value={seriesAId}
          onChange={setSeriesAId}
          catalog={catalog}
          defaultCountry="MX"
        />
        <CountryVarSelect
          id="serie-b"
          label="Serie B"
          value={seriesBId}
          onChange={setSeriesBId}
          catalog={catalog}
          defaultCountry="US"
        />
      </GlassPanel>

      <GlassPanel className="p-6">
        {!seriesAId && !seriesBId ? (
          <p className="text-sm text-foreground-muted">Elige dos series para compararlas lado a lado.</p>
        ) : loading ? (
          <p className="text-sm text-foreground-muted">Cargando series…</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {entryA && <Badge tone="mx">{entryA.fuente}</Badge>}
              {entryB && <Badge tone="us">{entryB.fuente}</Badge>}
            </div>
            <TimeSeriesChart
              seriesA={seriesA}
              seriesB={seriesB}
              labelA={entryA ? seriesShortLabel(entryA) : "Serie A"}
              labelB={entryB ? seriesShortLabel(entryB) : "Serie B"}
              unitA={entryA?.unidad}
              unitB={entryB?.unidad}
              height={380}
            />
          </>
        )}
      </GlassPanel>
    </div>
  );
}
