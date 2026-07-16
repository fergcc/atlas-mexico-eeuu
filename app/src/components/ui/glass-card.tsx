import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { GlassPanel } from "./glass-panel";

interface GlassCardProps {
  href?: string;
  className?: string;
  children: ReactNode;
  interactive?: boolean;
}

/**
 * A GlassPanel meant to be scanned in a grid (sector cards, indicator
 * cards, corridor cards). When `href` is given it renders as a real link
 * (never a clickable <div>) with hover/focus affordances.
 */
export function GlassCard({ href, className, children, interactive = true }: GlassCardProps) {
  const classes = cn(
    "block h-full p-6 transition-[transform,box-shadow,border-color] duration-200",
    interactive &&
      "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgb(79_70_229_/_0.25)] hover:border-primary/40",
    className
  );

  if (href) {
    return (
      <GlassPanel as={Link} href={href} className={classes}>
        {children}
      </GlassPanel>
    );
  }

  return <GlassPanel className={classes}>{children}</GlassPanel>;
}
