import { CalendarClock } from "lucide-react";
import { Badge } from "./badge";
import { formatDateLong } from "@/lib/formatters";

interface GeneratedAtBadgeProps {
  iso: string;
  className?: string;
}

/**
 * Page-level freshness signal — distinct from `FreshnessBadge` (which reads
 * a single series/indicator's own publication cadence). This one just says
 * honestly when the pipeline last generated the data shown on this page,
 * since the site is a static export with no live browser-side fetch.
 */
export function GeneratedAtBadge({ iso, className }: GeneratedAtBadgeProps) {
  return (
    <Badge
      tone="neutral"
      className={className}
      icon={<CalendarClock size={13} aria-hidden="true" />}
      title="Última corrida del pipeline del Engine que generó estos datos"
    >
      Datos al {formatDateLong(iso)}
    </Badge>
  );
}
