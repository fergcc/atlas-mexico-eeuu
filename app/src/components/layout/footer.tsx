import Link from "next/link";
import { Code2, Scale, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-glass">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-foreground-muted sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-base font-semibold text-foreground">Atlas México–EEUU</p>
            <p className="mt-2 leading-relaxed">
              Extensión de código abierto del Atlas prospectivo territorial-industrial, de Javier
              Jileta-Ockholm (Scientika, 2025), con causalidad de Granger y cointegración entre
              industrias de México y Estados Unidos. La capa de causalidad y cointegración es
              propia de este proyecto, no parte del libro original.
            </p>
          </div>
          <nav aria-label="Enlaces del pie de página" className="flex flex-col gap-2">
            <Link href="/metodologia" className="inline-flex items-center gap-2 hover:text-foreground">
              <Info size={15} aria-hidden="true" /> Metodología
            </Link>
            <Link href="/acerca" className="inline-flex items-center gap-2 hover:text-foreground">
              <Scale size={15} aria-hidden="true" /> Licencia MIT y créditos
            </Link>
            <a
              href="https://github.com/fergcc/atlas-mexico-eeuu"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <Code2 size={15} aria-hidden="true" /> Código en GitHub
            </a>
          </nav>
        </div>
        <p className="mt-8 text-xs text-foreground-muted/80">
          Datos de INEGI, Banxico, FRED, BEA y BLS. Actualización trimestral automatizada. Sin
          garantía de exactitud — uso informativo, no es asesoría de inversión.
        </p>
      </div>
    </footer>
  );
}
