"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  pathname: string | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Real overlay (backdrop + sliding panel) instead of the old in-flow
 * `<nav>` that just appeared under the header. `prefers-reduced-motion`'s
 * global CSS rule (globals.css) zeroes out CSS transitions/animations, but
 * it can't reach framer-motion's JS-driven transforms — `useReducedMotion()`
 * is the JS-side equivalent, so the panel cross-fades instead of sliding
 * for anyone with that preference.
 */
export function MobileNavDrawer({ id, open, onClose, links, pathname, triggerRef }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const shouldReduceMotion = useReducedMotion();

  function handleClose() {
    onClose();
    triggerRef.current?.focus();
  }

  // Move focus into the panel on open; lock body scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Escape closes (and returns focus to the trigger); Tab/Shift+Tab is
  // trapped inside the panel so keyboard focus never escapes to content
  // hidden behind the backdrop.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusables || focusables.length === 0) return;
      const list = Array.from(focusables);
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // AnimatePresence tracks exit animations by looking at its *direct*
  // children's keys — wrapping the backdrop + panel pair in a `<>` Fragment
  // hides them from that tracking (a Fragment isn't an animatable element
  // and can't carry `exit`), so the panel would render fine on open but
  // never actually unmount on close. A keyed array of the two motion
  // elements, instead of a Fragment, keeps both independently tracked.
  return (
    <AnimatePresence>
      {open && [
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
          onClick={handleClose}
          aria-hidden="true"
        />,
        <motion.div
          key="panel"
          ref={panelRef}
          id={id}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="glass-panel-strong fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-1 overflow-y-auto border-l border-border-glass p-5 md:hidden"
          initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 1 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 id={headingId} className="font-display text-base font-semibold text-foreground">
              Menú
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar menú"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Navegación móvil">
            <ul className="flex flex-col gap-1">
              {links.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={handleClose}
                      className={cn(
                        "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-foreground-muted hover:bg-foreground/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex items-center justify-between border-t border-border-glass pt-4">
            <span className="text-sm text-foreground-muted">Tema</span>
            <ThemeToggle />
          </div>
        </motion.div>,
      ]}
    </AnimatePresence>
  );
}
