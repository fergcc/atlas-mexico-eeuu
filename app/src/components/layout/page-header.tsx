import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Page-level metadata row (e.g. a `GeneratedAtBadge`) — renders between description and actions. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="mb-3 font-mono-data text-xs font-medium uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description && <div className="mt-4 text-base leading-relaxed text-foreground-muted">{description}</div>}
      {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
