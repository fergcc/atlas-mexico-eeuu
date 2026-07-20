"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Globe } from "lucide-react";

interface ClassData {
  analysis?: {
    overall_score?: number;
    recommended?: boolean;
    strategic_potential?: string;
    collective_efficiency?: { score: number; justification: string };
    innovation_capacity?: { score: number; justification: string };
    market_openness?: { score: number; justification: string };
    key_opportunities?: string[];
    key_risks?: string[];
  };
}

interface ClassificationCardProps {
  data: ClassData | null;
  className?: string;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs font-medium text-foreground">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-mono-data text-xs tabular-nums text-foreground-muted">
        {score}/10
      </span>
    </div>
  );
}

export function ClassificationCard({ data, className }: ClassificationCardProps) {
  const a = data?.analysis;
  if (!a) return null;

  const ce = a.collective_efficiency ?? { score: 0, justification: "" };
  const ic = a.innovation_capacity ?? { score: 0, justification: "" };
  const mo = a.market_openness ?? { score: 0, justification: "" };

  return (
    <GlassPanel className={className}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Brain size={18} className="text-primary" aria-hidden="true" />
        Clasificación estratégica — Rabellotti &amp; Giuliani
      </h3>

      <div className="space-y-4">
        <div>
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-foreground-muted" aria-hidden="true" />
              <ScoreBar label="Eficiencia colectiva" score={ce.score} />
            </div>
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-foreground-muted" aria-hidden="true" />
              <ScoreBar label="Innovación" score={ic.score} />
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-foreground-muted" aria-hidden="true" />
              <ScoreBar label="Apertura de mercado" score={mo.score} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Puntaje: {a.overall_score ?? "?"}/10</Badge>
            <Badge tone={a.recommended ? "success" : "danger"}>
              {a.recommended ? "Recomendado" : "No recomendado"}
            </Badge>
            <Badge tone="accent">Potencial: {a.strategic_potential ?? "—"}</Badge>
          </div>
        </div>

        {(ce.justification || ic.justification || mo.justification) && (
          <div className="rounded-xl bg-surface-glass p-4 text-sm text-foreground-muted space-y-2">
            {ce.justification ? <p><strong>Eficiencia colectiva:</strong> {ce.justification}</p> : null}
            {ic.justification ? <p><strong>Innovación:</strong> {ic.justification}</p> : null}
            {mo.justification ? <p><strong>Apertura de mercado:</strong> {mo.justification}</p> : null}
          </div>
        )}

        {(a.key_opportunities?.length ?? 0) > 0 || (a.key_risks?.length ?? 0) > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(a.key_opportunities?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-success/5 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-success">Oportunidades</p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  {(a.key_opportunities ?? []).map((o: string, i: number) => (
                    <li key={i}>• {o}</li>
                  ))}
                </ul>
              </div>
            )}
            {(a.key_risks?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-danger/5 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-danger">Riesgos</p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  {(a.key_risks ?? []).map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
