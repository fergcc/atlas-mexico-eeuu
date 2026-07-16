"use client";

import { useMemo, useCallback } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath, Circle } from "@visx/shape";
import { GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { formatNumber, formatPeriodLabel } from "@/lib/formatters";
import type { SeriesFile } from "@/lib/types";

interface TimeSeriesChartProps {
  seriesA: SeriesFile | null;
  seriesB: SeriesFile | null;
  labelA: string;
  labelB: string;
  unitA?: string;
  unitB?: string;
  height?: number;
}

interface AlignedPoint {
  period: string;
  valueA: number | null;
  valueB: number | null;
  indexA: number | null;
  indexB: number | null;
}

function alignAndNormalize(seriesA: SeriesFile | null, seriesB: SeriesFile | null): AlignedPoint[] {
  const periods = new Set<string>();
  seriesA?.observations.forEach((o) => periods.add(o.period));
  seriesB?.observations.forEach((o) => periods.add(o.period));
  const sortedPeriods = Array.from(periods).sort();

  const mapA = new Map(seriesA?.observations.map((o) => [o.period, o.value]) ?? []);
  const mapB = new Map(seriesB?.observations.map((o) => [o.period, o.value]) ?? []);

  const firstA = sortedPeriods.map((p) => mapA.get(p)).find((v) => v !== null && v !== undefined);
  const firstB = sortedPeriods.map((p) => mapB.get(p)).find((v) => v !== null && v !== undefined);

  return sortedPeriods.map((period) => {
    const valueA = mapA.get(period) ?? null;
    const valueB = mapB.get(period) ?? null;
    return {
      period,
      valueA,
      valueB,
      indexA: valueA !== null && firstA ? (valueA / firstA) * 100 : null,
      indexB: valueB !== null && firstB ? (valueB / firstB) * 100 : null,
    };
  });
}

const MARGIN = { top: 16, right: 20, bottom: 36, left: 44 };

function Chart({
  width,
  height,
  data,
  labelA,
  labelB,
  unitA,
  unitB,
}: TimeSeriesChartProps & { width: number; height: number; data: AlignedPoint[] }) {
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip, tooltipOpen } =
    useTooltip<AlignedPoint>();

  const xScale = useMemo(
    () =>
      scalePoint<string>({
        domain: data.map((d) => d.period),
        range: [0, innerWidth],
        padding: 0.5,
      }),
    [data, innerWidth]
  );

  const values = data.flatMap((d) => [d.indexA, d.indexB]).filter((v): v is number => v !== null);
  const yMin = values.length ? Math.min(...values) : 0;
  const yMax = values.length ? Math.max(...values) : 100;
  const yPad = (yMax - yMin) * 0.12 || 10;

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [yMin - yPad, yMax + yPad],
        range: [innerHeight, 0],
        nice: true,
      }),
    [yMin, yMax, yPad, innerHeight]
  );

  const handleMove = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event) ?? { x: 0 };
      const x = point.x - MARGIN.left;
      const step = innerWidth / Math.max(1, data.length - 1);
      const index = Math.max(0, Math.min(data.length - 1, Math.round(x / step)));
      const d = data[index];
      if (!d) return;
      showTooltip({
        tooltipData: d,
        tooltipLeft: (xScale(d.period) ?? 0) + MARGIN.left,
        tooltipTop: MARGIN.top,
      });
    },
    [data, innerWidth, xScale, showTooltip]
  );

  if (data.length === 0 || innerWidth <= 0) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Sin observaciones disponibles para graficar.
      </p>
    );
  }

  const tickEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="relative">
      <svg width={width} height={height} role="img" aria-label={`Serie de tiempo: ${labelA} vs ${labelB}`}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <GridRows scale={yScale} width={innerWidth} stroke="var(--border-glass)" strokeDasharray="2,3" />

          {data.map((d) =>
            d.indexA !== null ? (
              <Circle
                key={`a-${d.period}`}
                cx={xScale(d.period)}
                cy={yScale(d.indexA)}
                r={2.5}
                fill="var(--color-mx)"
              />
            ) : null
          )}
          {data.map((d) =>
            d.indexB !== null ? (
              <Circle
                key={`b-${d.period}`}
                cx={xScale(d.period)}
                cy={yScale(d.indexB)}
                r={2.5}
                fill="var(--color-us)"
              />
            ) : null
          )}

          <LinePath
            data={data.filter((d) => d.indexA !== null)}
            x={(d) => xScale(d.period) ?? 0}
            y={(d) => yScale(d.indexA as number)}
            stroke="var(--color-mx)"
            strokeWidth={2.5}
          />
          <LinePath
            data={data.filter((d) => d.indexB !== null)}
            x={(d) => xScale(d.period) ?? 0}
            y={(d) => yScale(d.indexB as number)}
            stroke="var(--color-us)"
            strokeWidth={2.5}
            strokeDasharray="6,4"
          />

          {tooltipOpen && tooltipData && (
            <line
              x1={xScale(tooltipData.period)}
              x2={xScale(tooltipData.period)}
              y1={0}
              y2={innerHeight}
              stroke="var(--foreground-muted)"
              strokeWidth={1}
              strokeDasharray="3,3"
              pointerEvents="none"
            />
          )}

          <AxisLeft
            scale={yScale}
            stroke="var(--border-glass)"
            tickStroke="var(--border-glass)"
            tickLabelProps={{
              fill: "var(--foreground-muted)",
              fontSize: 11,
              textAnchor: "end",
              dx: -4,
            }}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="var(--border-glass)"
            tickStroke="var(--border-glass)"
            tickFormat={(v) => formatPeriodLabel(String(v))}
            tickValues={xScale.domain().filter((_, i) => i % tickEvery === 0)}
            tickLabelProps={{
              fill: "var(--foreground-muted)",
              fontSize: 11,
              textAnchor: "middle",
            }}
          />

          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={hideTooltip}
          />
        </g>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          className="glass-panel-strong !rounded-xl !px-3 !py-2 !text-xs !shadow-lg"
          style={{}}
        >
          <p className="font-mono-data mb-1 text-foreground-muted">
            {formatPeriodLabel(tooltipData.period)}
          </p>
          {tooltipData.valueA !== null && (
            <p className="flex items-center gap-1.5 text-mx">
              <span className="h-2 w-2 rounded-full bg-mx" /> {labelA}:{" "}
              <span className="font-mono-data text-foreground">
                {formatNumber(tooltipData.valueA)} {unitA ?? ""}
              </span>
            </p>
          )}
          {tooltipData.valueB !== null && (
            <p className="flex items-center gap-1.5 text-us">
              <span className="h-2 w-2 rounded-full bg-us" /> {labelB}:{" "}
              <span className="font-mono-data text-foreground">
                {formatNumber(tooltipData.valueB)} {unitB ?? ""}
              </span>
            </p>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}

/**
 * MX vs US time-series overlay. Both lines are normalized to an index
 * (first common observation = 100) because the two series often carry
 * different units (e.g. an output index vs. thousands of jobs) — overlaying
 * raw values on one axis would misrepresent scale. Real units are always
 * shown in the tooltip.
 */
export function TimeSeriesChart(props: TimeSeriesChartProps) {
  const data = useMemo(() => alignAndNormalize(props.seriesA, props.seriesB), [props.seriesA, props.seriesB]);

  return (
    <div>
      <div style={{ height: props.height ?? 320 }}>
        <ParentSize>
          {({ width, height }) => <Chart {...props} width={width} height={height} data={data} />}
        </ParentSize>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mx" /> {props.labelA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-6 border-t-2 border-dashed border-us" /> {props.labelB}
        </span>
        <span className="text-foreground-muted/80">· Eje: índice, 100 = primer periodo común</span>
      </div>
    </div>
  );
}
