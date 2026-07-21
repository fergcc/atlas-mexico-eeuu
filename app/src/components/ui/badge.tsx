import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone =
  | "neutral"
  | "primary"
  | "mx"
  | "us"
  | "accent"
  | "warning"
  | "danger"
  | "success"
  | "signal-strong"
  | "signal-neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-foreground/[0.06] text-foreground-muted border-border-glass",
  primary: "bg-primary/10 text-primary border-primary/25",
  mx: "bg-mx/10 text-mx border-mx/25",
  us: "bg-us/10 text-us border-us/25",
  accent: "bg-accent/10 text-accent border-accent/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/25",
  success: "bg-success/10 text-success border-success/25",
  // Dedicated "evidence found / not found" tones — deliberately distinct
  // from `mx`/`success` so a "Sí, hay evidencia clara" badge never reads as
  // the same color as a "México" badge next to it (see globals.css).
  "signal-strong": "bg-signal-strong/10 text-signal-strong border-signal-strong/25",
  "signal-neutral": "bg-signal-neutral/10 text-signal-neutral border-signal-neutral/25",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  /** Escape hatch for the raw technical reading (e.g. a raw p-value) when
   * the visible label is the plain-language one — never the only way to
   * reach it, but a reasonable hover affordance alongside a `title` on the
   * pair itself. */
  title?: string;
}

export function Badge({ tone = "neutral", children, className, icon, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
