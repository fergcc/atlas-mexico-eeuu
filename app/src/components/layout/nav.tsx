"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Compass, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { fetchManifest } from "@/lib/client-data";
import type { SectorMeta } from "@/lib/types";

const LINKS = [
  { href: "/nacional", label: "Nacional" },
  { href: "/estatal", label: "Estatal" },
  { href: "/sectores", label: "Sectores" },
  { href: "/regiones", label: "Regiones" },
  { href: "/comparativa", label: "Comparativa" },
  { href: "/territorial", label: "Territorial" },
];

function SectorsDropdown() {
  const pathname = usePathname();
  const [sectors, setSectors] = useState<SectorMeta[]>([]);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    fetchManifest().then((m) => {
      if (m) setSectors(m.sectors);
    });
  }, []);

  const inSectorsSection = pathname?.startsWith("/sectores");
  const active = inSectorsSection;

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <li
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
        )}
      >
        Sectores
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 min-w-[280px] rounded-xl glass-dropdown p-1.5 shadow-lg"
        >
          {sectors.length === 0 ? (
            <span className="block px-3 py-2 text-sm text-foreground-muted">Cargando...</span>
          ) : (
            sectors.map((sector) => {
              const href = `/sectores/${sector.id}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={sector.id}
                  href={href}
                  role="menuitem"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {sector.label}
                </Link>
              );
            })
          )}
        </div>
      )}
    </li>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="nav-glass sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <Compass className="text-primary" size={22} aria-hidden="true" />
          <span>
            Atlas <span className="text-primary">MX</span>·<span className="text-us">EEUU</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => {
              if (link.href === "/sectores") {
                return <SectorsDropdown key={link.href} />;
              }
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
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileNavDrawer
        id="mobile-nav-drawer"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={LINKS}
        pathname={pathname}
        triggerRef={triggerRef}
      />
    </header>
  );
}
