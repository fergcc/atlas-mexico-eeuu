"use client";

import { useCallback, useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EngineStatusBadge } from "./engine-status-badge";
import { CgvCard } from "./cgv-card";
import { ClassificationCard } from "./classification-card";
import { NarrativeReport } from "./narrative-report";
import { hasEngine, analyzeSector, classifySector, generateNarrative } from "@/lib/engine-client";
import type { SectorAnalysis, ClassificationResult, NarrativeResult } from "@/lib/engine-client";

interface SectorAnalysisPanelProps {
  sectorId: string;
  sectorLabel: string;
  className?: string;
}

type TabId = "cgv" | "classification" | "narrative";

export function SectorAnalysisPanel({ sectorId, sectorLabel, className }: SectorAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cgv");
  const [cgvData, setCgvData] = useState<SectorAnalysis | null>(null);
  const [classificationData, setClassificationData] = useState<ClassificationResult | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCgv = useCallback(() => {
    setLoading(true);
    analyzeSector(sectorLabel, ["MX"]).then((d) => {
      setCgvData(d);
      setLoading(false);
    });
  }, [sectorLabel]);

  const loadClassification = useCallback(() => {
    setLoading(true);
    classifySector(sectorLabel).then((d) => {
      setClassificationData(d);
      setLoading(false);
    });
  }, [sectorLabel]);

  const loadNarrative = useCallback(() => {
    setLoading(true);
    generateNarrative(sectorId, ["MX"], "es").then((d) => {
      setNarrativeData(d);
      setLoading(false);
    });
  }, [sectorId]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    if (tab === "cgv" && !cgvData && hasEngine()) loadCgv();
    if (tab === "classification" && !classificationData && hasEngine()) loadClassification();
    if (tab === "narrative" && !narrativeData && hasEngine()) loadNarrative();
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

  if (!cgvData && !loading && activeTab === "cgv") {
    loadCgv();
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "cgv", label: "Cadena Global de Valor" },
    { id: "classification", label: "Clasificación Estratégica" },
    { id: "narrative", label: "Análisis Narrativo" },
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
          {activeTab === "cgv" && cgvData && (
            <CgvCard
              sector={sectorLabel}
              data={cgvData}
              className="p-6"
            />
          )}
          {activeTab === "classification" && (
            <ClassificationCard
              data={classificationData}
              className="p-6"
            />
          )}
          {activeTab === "narrative" && (
            <NarrativeReport
              sector={sectorLabel}
              countries="México"
              content={narrativeData?.narrative?.content ?? (narrativeData?.error ?? "")}
              className="p-6"
            />
          )}
        </div>
      )}
    </div>
  );
}
