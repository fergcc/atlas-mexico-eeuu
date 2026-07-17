import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item — it renders as the current page, not a link. */
  href?: string;
}

/**
 * "Dónde estoy" trail for the detail pages that had none before
 * (`/sectores/[sector]`, `/estatal/[estado]`, `/indicadores/[slug]`) — the
 * only way back up was the browser's back button or the top nav, which no
 * longer even lists every level (see `nav.tsx`).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-foreground-muted">
        <li className="flex items-center gap-1.5">
          <Link href="/" className="inline-flex items-center rounded hover:text-foreground">
            <Home size={14} aria-hidden="true" />
            <span className="sr-only">Inicio</span>
          </Link>
          <ChevronRight size={14} className="text-foreground-muted/50" aria-hidden="true" />
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="rounded hover:text-foreground hover:underline underline-offset-2">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={14} className="shrink-0 text-foreground-muted/50" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
