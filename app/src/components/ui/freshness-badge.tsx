import { CalendarClock, CalendarCheck2, CalendarRange, AlertTriangle } from "lucide-react";
import { getFreshnessInfo } from "@/lib/formatters";
import { Badge } from "./badge";
import type { FreshnessTone } from "@/lib/formatters";

interface FreshnessBadgeProps {
  periodicidad: string;
  ultima_actualizacion: string;
  proxima_actualizacion_estimada: string;
  referenceIso?: string;
  className?: string;
}

const TONE_MAP: Record<FreshnessTone, "success" | "primary" | "neutral" | "danger"> = {
  fresh: "success",
  stable: "primary",
  annual: "neutral",
  stale: "danger",
};

const ICON_MAP: Record<FreshnessTone, typeof CalendarClock> = {
  fresh: CalendarCheck2,
  stable: CalendarRange,
  annual: CalendarClock,
  stale: AlertTriangle,
};

/**
 * Communicates the REAL publication cadence of an indicator instead of a
 * generic "updated N days ago" — the pipeline runs quarterly, and most
 * underlying sources publish monthly/quarterly/annually with weeks-to-months
 * of lag, so implying weekly novelty would be misleading.
 */
export function FreshnessBadge({
  periodicidad,
  ultima_actualizacion,
  proxima_actualizacion_estimada,
  referenceIso,
  className,
}: FreshnessBadgeProps) {
  const info = getFreshnessInfo(
    { periodicidad, ultima_actualizacion, proxima_actualizacion_estimada },
    referenceIso
  );
  const Icon = ICON_MAP[info.tone];

  return (
    <span className={className} title={info.detail}>
      <Badge tone={TONE_MAP[info.tone]} icon={<Icon size={13} aria-hidden="true" />}>
        {info.label}
      </Badge>
    </span>
  );
}
