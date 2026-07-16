import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "primary" | "mx" | "us" | "accent" | "danger" | "success";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-foreground/[0.06] text-foreground-muted border-border-glass",
  primary: "bg-primary/10 text-primary border-primary/25",
  mx: "bg-mx/10 text-mx border-mx/25",
  us: "bg-us/10 text-us border-us/25",
  accent: "bg-accent/10 text-accent border-accent/30",
  danger: "bg-danger/10 text-danger border-danger/25",
  success: "bg-success/10 text-success border-success/25",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", children, className, icon }: BadgeProps) {
  return (
    <span
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
