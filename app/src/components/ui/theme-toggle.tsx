"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const emptySubscribe = () => () => {};

/**
 * True only after the client has hydrated. Implemented via
 * `useSyncExternalStore` (server snapshot = false, client snapshot = true)
 * rather than the classic `useState(false) + useEffect(() => setState(true))`
 * pattern, which triggers React's "avoid setState synchronously in an
 * effect" lint rule.
 */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-glass",
        "text-foreground-muted transition-colors hover:text-foreground hover:bg-foreground/5",
        className
      )}
    >
      {mounted ? (
        isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />
      ) : (
        <span className="block h-[17px] w-[17px]" />
      )}
    </button>
  );
}
