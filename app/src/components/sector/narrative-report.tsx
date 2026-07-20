"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";

interface NarrativeReportProps {
  sector: string;
  countries: string;
  content: string;
  className?: string;
}

export function NarrativeReport({ sector, countries, content, className }: NarrativeReportProps) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n+/).filter(Boolean);

  return (
    <GlassPanel className={cn("max-h-[600px] overflow-auto", className)}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground sticky top-0 bg-surface-glass z-10 pb-2">
        <FileText size={18} className="text-primary" aria-hidden="true" />
        Análisis — {sector} en {countries}
      </h3>
      <div className="prose-custom text-sm leading-relaxed text-foreground-muted space-y-4">
        {paragraphs.map((p, i) => {
          if (p.startsWith("## ")) {
            return <h4 key={i} className="font-display text-base font-semibold text-foreground pt-2">{p.replace(/^## /, "")}</h4>;
          }
          if (p.startsWith("### ")) {
            return <h5 key={i} className="font-display text-sm font-semibold text-foreground pt-1">{p.replace(/^### /, "")}</h5>;
          }
          return <p key={i}>{p}</p>;
        })}
      </div>
    </GlassPanel>
  );
}
