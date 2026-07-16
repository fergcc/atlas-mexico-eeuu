"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ComposableMap, Geographies } from "react-simple-maps";
import { geoMercator, type GeoProjection } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { fetchMxStatesTopology } from "@/lib/client-data";
import { MX_STATES } from "@/data/mx-states";
import { choroplethColor, normalize, NO_DATA_COLOR_LIGHT, NO_DATA_COLOR_DARK } from "@/lib/color-scales";
import { useMapStore } from "@/stores/map-store";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/cn";

// El TopoJSON real de los 32 estados (datamaps/Natural Earth, ver
// `data/geo/SOURCES.md`) solo trae `properties.name` con el nombre corto en
// español — no un código INEGI — así que el join contra `MX_STATES` se hace
// por nombre normalizado (sin acentos/mayúsculas), con un alias explícito
// para el único nombre que cambió: el dataset es anterior a la renombrada de
// 2016 y todavía usa "Distrito Federal" en vez de "Ciudad de México".
function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const NAME_ALIASES: Record<string, string> = {
  "distrito federal": "ciudad de mexico",
};

const CODE_BY_NORMALIZED_NAME: Record<string, string> = Object.fromEntries(
  MX_STATES.map((s) => [normalizeName(s.name), s.code])
);

/** Resolves a TopoJSON feature's raw Spanish name to a 2-digit INEGI state code. */
function codeForGeoName(rawName: unknown): string | null {
  if (typeof rawName !== "string" || rawName.length === 0) return null;
  const normalized = normalizeName(rawName);
  const aliased = NAME_ALIASES[normalized] ?? normalized;
  return CODE_BY_NORMALIZED_NAME[aliased] ?? null;
}

interface ChoroplethMapProps {
  /** state code ("01".."32") -> raw value */
  values: Record<string, number>;
  unit?: string;
  onSelectState?: (code: string) => void;
  selectedStateCode?: string | null;
  height?: number;
}

export function ChoroplethMap({ values, unit, onSelectState, selectedStateCode, height = 420 }: ChoroplethMapProps) {
  const hoveredStateCode = useMapStore((s) => s.hoveredStateCode);
  const setHoveredStateCode = useMapStore((s) => s.setHoveredStateCode);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; code: string } | null>(null);
  const [topology, setTopology] = useState<Topology | null>(null);
  const { resolvedTheme } = useTheme();
  const noDataColor = resolvedTheme === "dark" ? NO_DATA_COLOR_DARK : NO_DATA_COLOR_LIGHT;

  useEffect(() => {
    let cancelled = false;
    fetchMxStatesTopology().then((topo) => {
      if (!cancelled) setTopology(topo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const geoObject = useMemo(() => {
    if (!topology) return null;
    const geoObjectKey = Object.keys(topology.objects)[0];
    return topology.objects[geoObjectKey] as GeometryCollection<{ name: string | null }>;
  }, [topology]);

  const featureCollection = useMemo(() => {
    if (!topology || !geoObject) return null;
    return topojson.feature(topology, geoObject);
  }, [topology, geoObject]);

  const domain = useMemo(() => {
    const nums = Object.values(values).filter((v) => Number.isFinite(v));
    if (nums.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }, [values]);

  const MAP_WIDTH = 640;

  // react-simple-maps@3 treats a function `projection` prop as an
  // already-built d3 projection (it does NOT call it with width/height —
  // see `isFunc` in its source), so this must be the projection itself,
  // memoized once per size/data change, not a factory function.
  //
  // Mercator (conformal, so state outlines keep their real shape) fitted to
  // the feature collection's own bounds: Mexico spans a narrow ~14-33°N
  // latitude band, so Mercator's area distortion stays modest here, and
  // `fitSize` derives scale/translate automatically from the real lon/lat
  // geometry — no manual centering needed (unlike the old placeholder grid,
  // which required `geoIdentity` because it was already in screen space).
  const projection = useMemo(() => {
    if (!featureCollection) return null;
    return geoMercator().fitSize([MAP_WIDTH, height], featureCollection) as unknown as GeoProjection;
  }, [height, featureCollection]);

  if (!topology || !geoObject || !featureCollection || !projection) {
    return (
      <div
        className="flex items-center justify-center text-sm text-foreground-muted"
        style={{ height }}
        role="status"
      >
        Cargando mapa…
      </div>
    );
  }

  return (
    <div className="relative">
      <ComposableMap
        projection={projection as never}
        width={MAP_WIDTH}
        height={height}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label="Mapa coroplético de los 32 estados de México"
      >
        <Geographies geography={topology}>
          {({ geographies, path }) =>
            geographies.map((geo) => {
              const code = codeForGeoName(geo.properties.name);
              const name = code ? (MX_STATES.find((s) => s.code === code)?.name ?? geo.properties.name) : null;
              const value = code ? values[code] : undefined;
              const hasValue = typeof value === "number" && Number.isFinite(value);
              const fill = hasValue
                ? choroplethColor(normalize(value, domain.min, domain.max))
                : noDataColor;
              const isHovered = code !== null && hoveredStateCode === code;
              const isSelected = code !== null && selectedStateCode === code;

              // The dataset carries one unnamed fragment (a small sliver in
              // the Yucatán peninsula, id -99) that doesn't map to any of the
              // 32 states — render it as inert background fill so the map
              // has no visual gap, but skip interactivity/labels for it.
              if (!code) {
                return (
                  <path
                    key={geo.rsmKey}
                    d={path(geo) ?? undefined}
                    fill={noDataColor}
                    stroke="var(--background)"
                    strokeWidth={1}
                    aria-hidden="true"
                  />
                );
              }

              return (
                <path
                  key={geo.rsmKey}
                  d={path(geo) ?? undefined}
                  fill={fill}
                  stroke={isSelected ? "var(--color-primary)" : "var(--background)"}
                  strokeWidth={isSelected ? 2.5 : 1}
                  tabIndex={0}
                  role="button"
                  aria-label={`${name}${hasValue ? `: ${formatNumber(value)} ${unit ?? ""}` : ": sin dato"}`}
                  className={cn(
                    "cursor-pointer transition-[filter] duration-150 outline-none",
                    isHovered && "brightness-90"
                  )}
                  style={{ filter: isHovered ? "brightness(0.92)" : undefined }}
                  onMouseEnter={(e) => {
                    setHoveredStateCode(code);
                    setTooltip({ x: e.clientX, y: e.clientY, code });
                  }}
                  onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, code })}
                  onMouseLeave={() => {
                    setHoveredStateCode(null);
                    setTooltip(null);
                  }}
                  onFocus={() => setHoveredStateCode(code)}
                  onBlur={() => setHoveredStateCode(null)}
                  onClick={() => onSelectState?.(code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectState?.(code);
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip &&
        (() => {
          const state = MX_STATES.find((s) => s.code === tooltip.code);
          const name = state?.name ?? tooltip.code;
          const value = values[tooltip.code];
          const hasValue = typeof value === "number" && Number.isFinite(value);
          return (
            <div
              className="glass-panel-strong pointer-events-none fixed z-50 rounded-xl px-3 py-2 text-xs shadow-lg"
              style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
            >
              <p className="font-medium text-foreground">{name}</p>
              <p className="text-foreground-muted">
                {hasValue ? `${formatNumber(value)} ${unit ?? ""}` : "Sin dato disponible"}
              </p>
            </div>
          );
        })()}
    </div>
  );
}
