import { Badge } from "./badge";

interface DataQualityBadgeProps {
  real: number;
  total: number;
  /** "dot" prefixes a small filled dot (toolbar use); "compact" is a bare "n/n real" pill. */
  variant?: "dot" | "compact";
  className?: string;
}

const DOT_CLASSES = {
  success: "bg-success",
  warning: "bg-warning",
  neutral: "bg-foreground-muted",
} as const;

/**
 * Single source of truth for the "n/total real" reading used across the
 * territorial views — real === total is success, some real is warning
 * (mixed), zero real is neutral (fully mock/synthetic).
 */
export function DataQualityBadge({ real, total, variant = "compact", className }: DataQualityBadgeProps) {
  if (total === 0) return null;
  const tone = real === total ? "success" : real === 0 ? "neutral" : "warning";

  return (
    <Badge
      tone={tone}
      className={className}
      icon={variant === "dot" ? <span className={`h-2 w-2 rounded-full ${DOT_CLASSES[tone]}`} aria-hidden="true" /> : undefined}
    >
      {real}/{total} real
    </Badge>
  );
}
