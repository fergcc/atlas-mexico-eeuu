import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface KpiStatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "primary" | "mx" | "us" | "accent" | "neutral";
  className?: string;
}

const TONE_TEXT: Record<NonNullable<KpiStatProps["tone"]>, string> = {
  primary: "text-primary",
  mx: "text-mx",
  us: "text-us",
  accent: "text-accent",
  neutral: "text-foreground",
};

export function KpiStat({ label, value, hint, tone = "neutral", className }: KpiStatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</span>
      <span className={cn("font-display text-3xl font-semibold tabular-nums", TONE_TEXT[tone])}>{value}</span>
      {hint && <span className="text-xs text-foreground-muted">{hint}</span>}
    </div>
  );
}
