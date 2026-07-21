"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { EstatalExplorer } from "@/components/estatal/estatal-explorer";
import type { SectorStateDataset } from "@/lib/pair-helpers";
import { US_STATES } from "@/data/us-states";
import { CA_PROVINCES } from "@/data/ca-provinces";

const COUNTRIES = [
  { code: "MX" as const, label: "México", count: 32 },
  { code: "US" as const, label: "Estados Unidos", count: US_STATES.length },
  { code: "CA" as const, label: "Canadá", count: CA_PROVINCES.length },
];

interface CountrySwitcherProps {
  mxDatasets: SectorStateDataset[];
  usDatasets: SectorStateDataset[];
  caDatasets: SectorStateDataset[];
}

export function CountrySwitcher({ mxDatasets, usDatasets, caDatasets }: CountrySwitcherProps) {
  const [country, setCountry] = useState<"MX" | "US" | "CA">("MX");

  const datasets = country === "CA" ? caDatasets : country === "US" ? usDatasets : mxDatasets;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-full border border-border-glass p-1 w-fit" role="tablist" aria-label="Seleccionar país">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            role="tab"
            aria-selected={country === c.code}
            onClick={() => setCountry(c.code)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              country === c.code
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <EstatalExplorer country={country} datasets={datasets} />
    </div>
  );
}
