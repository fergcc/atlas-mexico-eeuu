import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("py-10 sm:py-14", className)}>{children}</section>;
}
