import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GlassPanelProps {
  as?: ElementType;
  strong?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * The base "content sits here" surface. Per the project's hard rule on
 * blur vs legibility: this component uses high opacity (88-96%) and
 * none-to-subtle blur — never the aggressive blur reserved for
 * `BackgroundAurora`'s decorative layer. Always has a 1px translucent
 * border so panels read as distinct surfaces without needing heavy blur.
 *
 * `as` is intentionally loosely typed (rather than a fully generic
 * `ElementType`-parameterized component) so it can render as `Link`,
 * `button`, or a plain `div` interchangeably with whatever extra props
 * that element needs (e.g. `href`).
 */
export function GlassPanel({ as, strong = false, className, children, ...rest }: GlassPanelProps) {
  const Component = (as ?? "div") as ElementType;
  return (
    // `min-w-0`: every page stacks these as flex/grid children (`Container`
    // with `flex flex-col`, or a card grid). Flex/grid items default to
    // `min-width: auto`, which lets a wide child (e.g. the evidence grid's
    // `minmax(...)` columns) force the *whole flex container* to overflow
    // horizontally instead of scrolling inside its own `overflow-x-auto`
    // wrapper. `min-w-0` here is what actually makes that inner scroll
    // container work, at any viewport.
    <Component
      className={cn("min-w-0 rounded-2xl", strong ? "glass-panel-strong" : "glass-panel", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
