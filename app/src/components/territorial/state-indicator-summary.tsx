import Link from "next/link";
import { formatNumber } from "@/lib/formatters";
import { DataQualityBadge } from "@/components/ui/data-quality-badge";
import type { TerritorialIndicatorValue } from "@/lib/types";

interface StateIndicatorSummaryProps {
  values: TerritorialIndicatorValue[];
}

const THEME_LABELS: Record<string, string> = {
  basic_services: "Servicios básicos",
  employment: "Empleo",
  environment: "Medio ambiente",
  government_capacity: "Capacidad de gobierno",
  housing: "Vivienda",
  industrial_concentration: "Concentración industrial",
  innovation_human_capital: "Innovación y capital humano",
  mobility: "Movilidad",
  social_problems: "Problemática social",
};

const DOT_CLASSES: Record<string, string> = {
  real: "bg-success",
  synthetic: "bg-warning",
};

function groupByTheme(values: TerritorialIndicatorValue[]) {
  const groups = new Map<string, TerritorialIndicatorValue[]>();
  for (const v of values) {
    const list = groups.get(v.theme) ?? [];
    list.push(v);
    groups.set(v.theme, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => (THEME_LABELS[a] ?? a).localeCompare(THEME_LABELS[b] ?? b));
}

/**
 * Compact per-state view into the 34 territorial indicators — a summary
 * card, not the full 34×32 matrix (that lives at `/territorial`). Grouped
 * by theme so a reader can scan "housing", "environment", etc. at a glance.
 */
export function StateIndicatorSummary({ values }: StateIndicatorSummaryProps) {
  if (values.length === 0) return null;

  const real = values.filter((v) => v.data_quality === "real").length;
  const groups = groupByTheme(values);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground-muted">
          {values.length} indicadores del Atlas Prospectivo Territorial-Industrial para este estado.
        </p>
        <DataQualityBadge real={real} total={values.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map(([theme, items]) => (
          <div key={theme} className="rounded-xl bg-foreground/[0.03] p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {THEME_LABELS[theme] ?? theme}
            </p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {items.map((item) => (
                <li key={item.indicator_id} className="flex items-center justify-between gap-3" title={item.note}>
                  <span className="flex min-w-0 items-center gap-1.5 text-foreground-muted">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[item.data_quality] ?? "bg-foreground-muted"}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.indicator_name}</span>
                  </span>
                  <span className="shrink-0 font-mono-data text-xs text-foreground">
                    {formatNumber(item.value)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link href="/territorial" className="text-sm font-medium text-primary hover:underline">
        Ver matriz completa de 34 indicadores →
      </Link>
    </div>
  );
}
