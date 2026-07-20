"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EngineStatusBadge } from "./engine-status-badge";
import { CgvCard } from "./cgv-card";
import { ClassificationCard } from "./classification-card";
import { NarrativeReport } from "./narrative-report";
import { hasEngine, analyzeSector, classifySector, generateNarrative } from "@/lib/engine-client";

interface SectorAnalysisPanelProps {
  sectorId: string;
  sectorLabel: string;
  className?: string;
}

export function SectorAnalysisPanel({ sectorId, sectorLabel, className }: SectorAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<"cgv" | "classification" | "narrative">("cgv");
  const [cgvData, setCgvData] = useState<any>(null);
  const [classificationData, setClassificationData] = useState<any>(null);
  const [narrativeData, setNarrativeData] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!hasEngine()) return;
    setLoading("cgv");
    analyzeSector(sectorLabel, ["MX"]).then((d) => {
      setCgvData(d);
      setLoading(null);
    });
  }, [sectorId]);

  function handleTabChange(tab: "cgv" | "classification" | "narrative") {
    setActiveTab(tab);
    if (tab === "classification" && !classificationData && hasEngine()) {
      setLoading("classification");
      classifySector(sectorLabel).then((d) => {
        setClassificationData(d);
        setLoading(null);
      });
    }
    if (tab === "narrative" && !narrativeData && hasEngine()) {
      setLoading("narrative");
      generateNarrative(sectorId, ["MX"], "es").then((d) => {
        setNarrativeData(d);
        setLoading(null);
      });
    }
  }

  if (!hasEngine()) {
    return (
      <GlassPanel className={className}>
        <div className="p-6 text-center">
          <p className="text-sm text-foreground-muted">
            Configura <code className="font-mono-data text-primary">NEXT_PUBLIC_ENGINE_URL</code> para ver análisis del Engine.
          </p>
        </div>
      </GlassPanel>
    );
  }

  const tabs = [
    { id: "cgv" as const, label: "Cadena Global de Valor" },
    { id: "classification" as const, label: "Clasificación Estratégica" },
    { id: "narrative" as const, label: "Análisis Narrativo" },
  ];

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-full border border-border-glass p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <EngineStatusBadge />
      </div>

      {loading ? (
        <GlassPanel className="p-8 text-center text-sm text-foreground-muted">
          Cargando análisis desde el Engine...
        </GlassPanel>
      ) : (
        <div className="space-y-6">
          {activeTab === "cgv" && (
            <CgvCard
              sector={sectorLabel}
              data={cgvData?.analysis}
              className="p-6"
            />
          )}
          {activeTab === "classification" && (
            <ClassificationCard
              sector={sectorLabel}
              data={classificationData}
              className="p-6"
            />
          )}
          {activeTab === "narrative" && (
            <NarrativeReport
              sector={sectorLabel}
              countries="México"
              content={narrativeData?.narrative?.content ?? (narrativeData?.error ? `Error: ${narrativeData.error}` : "")}
              className="p-6"
            />
          )}
        </div>
      )}
    </div>
  );
}
