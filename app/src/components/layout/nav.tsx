"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Compass } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

// "Metodología" and "Acerca" already live in the footer (`footer.tsx`) — having
// them here too was pure duplication. Five short labels also means tablets no
// longer always fall back to the hamburger (see the `md:` breakpoint below,
// down from `lg:`).
const LINKS = [
  { href: "/nacional", label: "Nacional" },
  { href: "/estatal", label: "Estatal" },
  { href: "/sectores", label: "Sectores" },
  { href: "/regiones", label: "Regiones" },
  { href: "/comparativa", label: "Comparativa" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="nav-glass sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
          onClick={() => setOpen(false)}
        >
          <Compass className="text-primary" size={22} aria-hidden="true" />
          <span>
            Atlas <span className="text-primary">MX</span>·<span className="text-us">EEUU</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground md:hidden"
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileNavDrawer
        id="mobile-nav-drawer"
        open={open}
        onClose={() => setOpen(false)}
        links={LINKS}
        pathname={pathname}
        triggerRef={triggerRef}
      />
    </header>
  );
}
