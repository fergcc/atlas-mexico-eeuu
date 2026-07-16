"use client";

import { useEffect, useState } from "react";
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

function SeriesSelect({
  id,
  label,
  value,
  onChange,
  catalog,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  catalog: SeriesCatalogEntry[];
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-xl border border-border-glass bg-background-elevated px-3.5 py-2.5 text-sm text-foreground"
      >
        <option value="">Selecciona una serie…</option>
        {catalog.map((s) => (
          <option key={s.id} value={s.id}>
            [{s.pais}] {s.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ComparativaClient({ catalog }: ComparativaClientProps) {
  const defaultA = catalog.find((s) => s.pais === "MX")?.id ?? "";
  const defaultB = catalog.find((s) => s.pais === "US")?.id ?? "";

  const [seriesAId, setSeriesAId] = useQueryState("a", parseAsString.withDefault(defaultA));
  const [seriesBId, setSeriesBId] = useQueryState("b", parseAsString.withDefault(defaultB));

  // Keyed by the ids it was fetched for, so `loading` can be *derived*
  // (current ids vs. the ids the last fetch resolved) instead of set
  // synchronously inside the effect body.
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
        <SeriesSelect id="serie-a" label="Serie A (normalmente México)" value={seriesAId} onChange={setSeriesAId} catalog={catalog} />
        <SeriesSelect id="serie-b" label="Serie B (normalmente EEUU)" value={seriesBId} onChange={setSeriesBId} catalog={catalog} />
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
