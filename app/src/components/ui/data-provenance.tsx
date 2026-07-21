import { formatDateLong } from "@/lib/formatters";
import { TechnicalDetail } from "./technical-detail";

interface DataProvenanceProps {
  generatedAt: string;
  refreshCadence: string;
  mode: "mock" | "live" | "mixed" | string;
  /** "disclosure" (default) collapses behind a small trigger; "static" always renders the sentence. */
  variant?: "disclosure" | "static";
  className?: string;
}

const MODE_LABEL: Record<string, string> = {
  mock: "datos de demostración",
  mixed: "mixto (real + demostración)",
  live: "datos reales",
};

function provenanceSentence({ generatedAt, refreshCadence, mode }: Pick<DataProvenanceProps, "generatedAt" | "refreshCadence" | "mode">) {
  return `Estos datos se actualizan ${refreshCadence} vía un pipeline automatizado. Última corrida: ${formatDateLong(generatedAt)}. Modo: ${MODE_LABEL[mode] ?? mode}.`;
}

/**
 * Honest substitute for a "live" claim the site can't back up (it's a
 * static export, no browser-side fetch to the Engine) — explains, in one
 * sentence, when the pipeline actually ran and how real the data is.
 */
export function DataProvenance({ generatedAt, refreshCadence, mode, variant = "disclosure", className }: DataProvenanceProps) {
  const sentence = provenanceSentence({ generatedAt, refreshCadence, mode });

  if (variant === "static") {
    return <p className={className ?? "text-sm leading-relaxed text-foreground-muted"}>{sentence}</p>;
  }

  return (
    <TechnicalDetail summary="¿Qué tan actualizado está esto?" className={className}>
      {sentence}
    </TechnicalDetail>
  );
}
