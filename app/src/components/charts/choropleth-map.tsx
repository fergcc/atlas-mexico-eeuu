"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies } from "react-simple-maps";
import { geoIdentity, type GeoProjection } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import mxStatesTopology from "@/data/geo/mx-states-placeholder-topo.json";
import { choroplethColor, normalize, NO_DATA_COLOR_LIGHT } from "@/lib/color-scales";
import { useMapStore } from "@/stores/map-store";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/cn";

// TODO: reemplazar `mx-states-placeholder-topo.json` con el TopoJSON oficial
// del Marco Geoestadístico de INEGI en cuanto `data/geo/` lo produzca el
// pipeline. La geometría actual es una cuadrícula esquemática (NO geografía
// real) — ver src/data/geo/mx-states-placeholder-topo.json.
const topology = mxStatesTopology as unknown as Topology;
const geoObjectKey = Object.keys(topology.objects)[0];
const geoObject = topology.objects[geoObjectKey] as GeometryCollection<{ code: string; name: string }>;

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

  const featureCollection = useMemo(() => topojson.feature(topology, geoObject), []);

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
  const projection = useMemo(
    () => geoIdentity().fitSize([MAP_WIDTH, height], featureCollection) as unknown as GeoProjection,
    [height, featureCollection]
  );

  return (
    <div className="relative">
      <ComposableMap
        projection={projection as never}
        width={MAP_WIDTH}
        height={height}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label="Mapa coroplético esquemático de los 32 estados de México"
      >
        <Geographies geography={topology}>
          {({ geographies, path }) =>
            geographies.map((geo) => {
              const code = geo.properties.code as string;
              const name = geo.properties.name as string;
              const value = values[code];
              const hasValue = typeof value === "number" && Number.isFinite(value);
              const fill = hasValue
                ? choroplethColor(normalize(value, domain.min, domain.max))
                : NO_DATA_COLOR_LIGHT;
              const isHovered = hoveredStateCode === code;
              const isSelected = selectedStateCode === code;

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
          const geo = featureCollection.features.find((f) => f.properties?.code === tooltip.code);
          const name = (geo?.properties?.name as string) ?? tooltip.code;
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

      <p className="mt-3 text-xs text-foreground-muted">
        Geometría esquemática provisional (no es el mapa real de México) — se reemplazará por el
        Marco Geoestadístico de INEGI cuando el pipeline lo publique en <code className="font-mono-data">data/geo/</code>.
      </p>
    </div>
  );
}
