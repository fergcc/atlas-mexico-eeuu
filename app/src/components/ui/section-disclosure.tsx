import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SectionDisclosureProps {
  summary: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Native `<details>`/`<summary>` disclosure — same accessibility pattern as
 * `TechnicalDetail` (keyboard operable, native screen-reader semantics, zero
 * JS) but applied one level up: hiding a *whole per-pair analysis section*
 * (mini time-series chart + full Granger/cointegration/stationarity
 * breakdown) rather than a single inline statistic.
 *
 * Unlike `TechnicalDetail`, this does not force `font-mono-data`/`text-xs`
 * on its children — the collapsed content here is a full-size chart and
 * result cards, not a compact technical annotation, so it keeps normal
 * typography.
 *
 * Exists because `/nacional`, `/sectores/[sector]` and `/estatal/[estado]`
 * used to render every pair's full detail (chart + stats) expanded
 * simultaneously, one after another — with 21 pairs that produced a
 * ~32,500px page. Collapsed by default, this turns each page into a compact
 * scannable list with detail on demand.
 */
export function SectionDisclosure({ summary, children, className, defaultOpen = false }: SectionDisclosureProps) {
  return (
    <details className={cn("group/section", className)} open={defaultOpen}>
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary [&::-webkit-details-marker]:hidden hover:underline"
      >
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform duration-150 group-open/section:rotate-180"
          aria-hidden="true"
        />
        {summary}
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}
