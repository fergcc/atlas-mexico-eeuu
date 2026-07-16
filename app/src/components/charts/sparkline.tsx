"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import type { SeriesObservation } from "@/lib/types";

/** Small trend preview for indicator detail pages. Full detail lives in TimeSeriesChart. */
export function Sparkline({ observations, color = "var(--color-primary)" }: { observations: SeriesObservation[]; color?: string }) {
  const data = observations.filter((o) => o.value !== null);
  if (data.length < 2) {
    return <p className="text-xs text-foreground-muted">Insuficientes observaciones para una vista previa.</p>;
  }
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
