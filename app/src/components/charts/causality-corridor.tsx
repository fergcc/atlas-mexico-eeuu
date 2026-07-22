import { ArrowRight, ArrowLeft, ArrowLeftRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TechnicalDetail } from "@/components/ui/technical-detail";
import { formatPValue } from "@/lib/formatters";
import { grangerPlainLabel, causalNarrative } from "@/lib/plain-language";
import { cn } from "@/lib/cn";
import type { Country } from "@/lib/types";

export interface CorridorSeriesInfo {
  id: string;
  /** Full display name — never truncated. */
  label: string;
  /** Short "country, source" gloss, e.g. "México, INEGI". */
  sublabel?: string;
  /** Full source string, kept for the title attribute / technical layer. */
  fullSource?: string;
  country: Country;
}

/** Display name, compact code, and color classes per country — the single
 * source of truth so no component hardcodes "MX"/"EEUU" text or colors. */
const COUNTRY_META: Record<Country, { name: string; code: string; textClass: string; borderClass: string }> = {
  MX: { name: "México", code: "MX", textClass: "text-mx", borderClass: "border-mx" },
  US: { name: "Estados Unidos", code: "EEUU", textClass: "text-us", borderClass: "border-us" },
  // Canadá reutiliza `accent` — ya es su identidad visual en el resto del
  // sitio (ver `/canadiense/[provincia]`) — en vez de crear un token nuevo.
  CA: { name: "Canadá", code: "CA", textClass: "text-accent", borderClass: "border-accent" },
};

export interface CorridorDirectionResult {
  significant: boolean;
  pValue: number | null;
  fStat?: number | null;
}

export interface CorridorPairData {
  id: string;
  /** Short label for the compact overview ribbon (usually the sector name). */
  rowLabel: string;
  a: CorridorSeriesInfo;
  b: CorridorSeriesInfo;
  aCausesB: CorridorDirectionResult;
  bCausesA: CorridorDirectionResult;
}

interface CausalityCorridorProps {
  pairs: CorridorPairData[];
  variant?: "detail" | "overview";
  className?: string;
}

/**
 * Replaces `GrangerGraph` (reactflow + dagre). Each relationship here is a
 * *fixed* pair tested in both directions — there is no many-to-many topology
 * to explore, so a force-directed graph library was solving a problem this
 * data doesn't have. It also could not fit real series names: dagre nodes
 * were a hardcoded 260px, which truncates names like "Producción
 * manufacturera - Energía eólica y aerogeneradores (México, nacional, INEGI
 * real [proxy])" into illegible fragments, and two curved edges per pair
 * (a→b and b→a) read as a tangle rather than "one relationship, two
 * directions."
 *
 * `detail`: one full-width card per pair, real names wrap to as many lines
 * as they need (never truncated) — used on `/sectores/[sector]` and
 * `/nacional` where a handful of pairs get real scrutiny.
 *
 * `overview`: a compact two-column ribbon list (per-pair country codes,
 * never hardcoded to MX/US) — used in the homepage hero and the `/nacional`
 * header, where the goal is a glanceable "how connected is this, overall"
 * rather than per-pair detail.
 */
export function CausalityCorridor({ pairs, variant = "detail", className }: CausalityCorridorProps) {
  if (pairs.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Sin pares con resultado suficiente para construir el corredor de causalidad.
      </p>
    );
  }

  if (variant === "overview") {
    return <CorridorOverview pairs={pairs} className={className} />;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {pairs.map((pair) => (
        <CorridorDetailCard key={pair.id} pair={pair} />
      ))}
    </div>
  );
}

function CorridorDetailCard({ pair }: { pair: CorridorPairData }) {
  const narrative = causalNarrative({
    aSignificant: pair.aCausesB.significant,
    bSignificant: pair.bCausesA.significant,
    labelA: pair.a.label,
    labelB: pair.b.label,
  });

  return (
    <div className="rounded-2xl border border-border-glass bg-surface-glass p-5 sm:p-6" title={pair.id}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SeriesHeader series={pair.a} align="left" />
        <SeriesHeader series={pair.b} align="right" />
      </div>

      <div className="my-4 border-t border-border-glass" />

      <div className="flex flex-col gap-3">
        <DirectionRow fromLabel={COUNTRY_META[pair.a.country].code} toLabel={COUNTRY_META[pair.b.country].code} result={pair.aCausesB} />
        <DirectionRow fromLabel={COUNTRY_META[pair.b.country].code} toLabel={COUNTRY_META[pair.a.country].code} result={pair.bCausesA} />
      </div>

      <p className="mt-4 text-pretty text-sm italic leading-relaxed text-foreground-muted">&ldquo;{narrative}&rdquo;</p>

      <TechnicalDetail className="mt-3">
        Causalidad de Granger (F-test) · {COUNTRY_META[pair.a.country].code}→{COUNTRY_META[pair.b.country].code}: F ={" "}
        {pair.aCausesB.fStat?.toFixed?.(2) ?? "s/d"}, p ajustada (FDR) = {formatPValue(pair.aCausesB.pValue)} ·{" "}
        {COUNTRY_META[pair.b.country].code}→{COUNTRY_META[pair.a.country].code}: F = {pair.bCausesA.fStat?.toFixed?.(2) ?? "s/d"},
        p ajustada (FDR) = {formatPValue(pair.bCausesA.pValue)}
      </TechnicalDetail>
    </div>
  );
}

function SeriesHeader({ series, align }: { series: CorridorSeriesInfo; align: "left" | "right" }) {
  const meta = COUNTRY_META[series.country];
  return (
    <div
      className={cn(
        "min-w-0 border-l-[3px] pl-3",
        meta.borderClass,
        align === "right" && "sm:border-l-0 sm:border-r-[3px] sm:pl-0 sm:pr-3 sm:text-right"
      )}
    >
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", meta.textClass)}>
        {meta.name}
      </p>
      <p className="mt-0.5 text-pretty text-sm font-semibold leading-snug text-foreground">{series.label}</p>
      {series.sublabel && (
        <p className="mt-0.5 text-xs text-foreground-muted" title={series.fullSource ?? series.sublabel}>
          {series.sublabel}
        </p>
      )}
    </div>
  );
}

function DirectionRow({
  fromLabel,
  toLabel,
  result,
}: {
  fromLabel: string;
  toLabel: string;
  result: CorridorDirectionResult;
}) {
  const { significant } = result;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-14 shrink-0 font-mono-data text-xs font-medium text-foreground-muted">{fromLabel}</span>
      <div className="flex min-w-[96px] flex-1 items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full border-2",
            significant ? "border-signal-strong bg-signal-strong" : "border-signal-neutral bg-transparent"
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "h-0 flex-1 border-t-2",
            significant ? "border-solid border-signal-strong" : "border-dashed border-signal-neutral"
          )}
          aria-hidden="true"
        />
        {significant ? (
          <ArrowRight size={15} className="shrink-0 text-signal-strong" aria-hidden="true" />
        ) : (
          <ArrowRight size={15} className="shrink-0 text-signal-neutral opacity-60" aria-hidden="true" />
        )}
      </div>
      <span className="w-14 shrink-0 font-mono-data text-xs font-medium text-foreground-muted">{toLabel}</span>
      <Badge tone={significant ? "signal-strong" : "signal-neutral"} className="ml-auto shrink-0">
        {grangerPlainLabel(significant)}
      </Badge>
    </div>
  );
}

function CorridorOverview({ pairs, className }: { pairs: CorridorPairData[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {pairs.map((pair) => (
        <OverviewRow key={pair.id} pair={pair} />
      ))}
    </div>
  );
}

function OverviewRow({ pair }: { pair: CorridorPairData }) {
  const aSig = pair.aCausesB.significant;
  const bSig = pair.bCausesA.significant;
  const strength = Math.max(
    aSig ? 1 - (pair.aCausesB.pValue ?? 1) : 0,
    bSig ? 1 - (pair.bCausesA.pValue ?? 1) : 0
  );
  const ribbonHeight = Math.max(2, Math.min(5, Math.round(2 + strength * 3)));
  const anySig = aSig || bSig;

  const metaA = COUNTRY_META[pair.a.country];
  const metaB = COUNTRY_META[pair.b.country];
  const Icon = aSig && bSig ? ArrowLeftRight : aSig ? ArrowRight : bSig ? ArrowLeft : Minus;
  const iconLabel =
    aSig && bSig
      ? "se anticipan mutuamente"
      : aSig
        ? `${metaA.name} anticipa a ${metaB.name}`
        : bSig
          ? `${metaB.name} anticipa a ${metaA.name}`
          : "sin evidencia de anticipación";

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-20 min-w-0 shrink-0 truncate text-xs font-medium text-foreground sm:w-32 sm:text-sm"
        title={`${pair.a.label} ↔ ${pair.b.label}`}
      >
        {pair.rowLabel}
      </span>
      <div className="flex flex-1 items-center gap-1.5">
        <span className={cn("shrink-0 font-mono-data text-[10px] font-semibold", metaA.textClass)}>{metaA.code}</span>
        <span
          className={cn("flex-1 rounded-full", anySig ? "bg-signal-strong" : "bg-signal-neutral/50")}
          style={{ height: ribbonHeight }}
          aria-hidden="true"
        />
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            anySig ? "text-signal-strong" : "text-signal-neutral"
          )}
          title={iconLabel}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
        <span
          className={cn("flex-1 rounded-full", anySig ? "bg-signal-strong" : "bg-signal-neutral/50")}
          style={{ height: ribbonHeight }}
          aria-hidden="true"
        />
        <span className={cn("shrink-0 font-mono-data text-[10px] font-semibold", metaB.textClass)}>{metaB.code}</span>
      </div>
      <span className="sr-only">
        {pair.a.label} y {pair.b.label}: {iconLabel}
      </span>
    </div>
  );
}
