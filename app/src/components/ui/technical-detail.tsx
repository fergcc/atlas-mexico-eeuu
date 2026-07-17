import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface TechnicalDetailProps {
  summary?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Native `<details>`/`<summary>` disclosure for "the technical layer under
 * the plain-language answer" (test names, raw p-values, VECM coefficients,
 * raw pair/series IDs). Deliberately not a custom accordion: native
 * disclosure gets keyboard operability, screen-reader semantics, and
 * find-in-page support for free, with zero JS.
 *
 * JetBrains Mono (`font-mono-data`) is reserved project-wide for exactly
 * this "technical layer" — its presence is itself a signal that what
 * follows is the raw statistic, not the plain-language reading.
 */
export function TechnicalDetail({ summary = "Ver detalle técnico", children, className }: TechnicalDetailProps) {
  return (
    <details className={cn("group/detail", className)}>
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden hover:underline"
      >
        <ChevronRight
          size={13}
          className="shrink-0 transition-transform duration-150 group-open/detail:rotate-90"
          aria-hidden="true"
        />
        {summary}
      </summary>
      <div className="mt-2 font-mono-data text-xs leading-relaxed text-foreground-muted">{children}</div>
    </details>
  );
}
