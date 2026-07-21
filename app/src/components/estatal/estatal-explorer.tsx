"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsStringEnum } from "nuqs";
import { ChoroplethMap } from "@/components/charts/choropleth-map";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MX_STATES, getMxStateByCode } from "@/data/mx-states";
import { US_STATES, getUsStateByFips } from "@/data/us-states";
import { CA_PROVINCES, getCaProvinceByCode } from "@/data/ca-provinces";
import type { SectorStateDataset } from "@/lib/pair-helpers";
import { cn } from "@/lib/cn";

interface EstatalExplorerProps {
  country: "MX" | "US" | "CA";
  datasets: SectorStateDataset[];
}

export function EstatalExplorer({ country, datasets }: EstatalExplorerProps) {
  const router = useRouter();
  const sectorIds = useMemo(() => datasets.map((d) => d.sectorId), [datasets]);
  const isUs = country === "US";
  const isCa = country === "CA";

  const [sectorId, setSectorId] = useQueryState(
    "sector",
    parseAsStringEnum(sectorIds.length ? sectorIds : ["_none"]).withDefault(sectorIds[0] ?? "_none")
  );
  const [metric, setMetric] = useQueryState(
    "metrica",
    parseAsStringEnum(["valor", "causalidad"]).withDefault("valor")
  );

  const active = datasets.find((d) => d.sectorId === sectorId) ?? datasets[0];
  const values = active ? (metric === "causalidad" ? active.strengthByState : active.valuesByState) : {};

  const states = useMemo(
    () =>
      isCa
        ? CA_PROVINCES.map((s) => ({ code: s.code, name: s.name, slug: s.slug }))
        : isUs
          ? US_STATES.map((s) => ({ code: s.fips, name: s.name, slug: s.slug }))
          : MX_STATES,
    [isUs, isCa]
  );

  const statesWithData = useMemo(
    () => states.filter((s) => active && active.valuesByState[s.code] !== undefined),
    [active, states]
  );

  const stateRoute = isCa ? "/canadiense" : isUs ? "/estadounidense" : "/estatal";

  if (datasets.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-sm text-foreground-muted">
          Aún no hay pares a nivel estatal en el manifiesto. El selector de sector/indicador aparecerá
          en cuanto el pipeline publique al menos un par con <code className="font-mono-data">level: &quot;estatal&quot;</code>.
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground-muted" htmlFor="sector-select">
          Sector
        </label>
        <select
          id="sector-select"
          name="sector"
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="rounded-full glass-dropdown px-3.5 py-2 text-sm text-foreground"
        >
          {datasets.map((d) => (
            <option key={d.sectorId} value={d.sectorId}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="ml-2 flex overflow-hidden rounded-full border border-border-glass" role="radiogroup" aria-label="Métrica a mostrar">
          {(
            [
              ["valor", "Valor más reciente"],
              ["causalidad", "Fuerza de causalidad"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={metric === value}
              onClick={() => setMetric(value)}
              className={cn(
                "px-3.5 py-2 text-sm font-medium transition-colors",
                metric === value ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-foreground/5"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          {isUs ? "Estados con dato para " : "Estados con dato para "}{active?.label}
        </h2>
        {statesWithData.length === 0 ? (
          <p className="text-sm text-foreground-muted">Ningún estado tiene todavía un dato para este sector.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {statesWithData.map((s) => (
              <a
                key={s.code}
                href={`${stateRoute}/${s.slug}`}
                className="rounded-full border border-border-glass px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <GlassPanel className="p-6">
        <ChoroplethMap
          country={country}
          values={values}
          unit={metric === "valor" ? active?.unit : undefined}
          onSelectState={(code) => {
            const state = isCa ? getCaProvinceByCode(code) : isUs ? getUsStateByFips(code) : getMxStateByCode(code);
            if (state) router.push(`${stateRoute}/${state.slug}`);
          }}
        />
      </GlassPanel>
    </div>
  );
}
