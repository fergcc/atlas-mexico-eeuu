import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { GlassPanel } from "./glass-panel";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <GlassPanel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon ?? <Inbox size={20} aria-hidden="true" />}
      </span>
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-md text-sm text-foreground-muted">{description}</p>}
    </GlassPanel>
  );
}
