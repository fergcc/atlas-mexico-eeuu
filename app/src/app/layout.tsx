import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { BackgroundAurora } from "@/components/layout/background-aurora";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atlas México–EEUU | Causalidad y cointegración industrial",
    template: "%s | Atlas México–EEUU",
  },
  description:
    "Dashboard abierto de causalidad de Granger y cointegración entre industrias de México y Estados Unidos, extendiendo el Atlas Prospectivo 2021 con datos trimestrales de INEGI, Banxico, FRED, BEA y BLS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <NuqsAdapter>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <a
              href="#main-content"
              className="skip-link glass-panel-strong rounded-full px-4 py-2 text-sm font-medium text-foreground"
            >
              Saltar al contenido principal
            </a>
            <BackgroundAurora />
            <div className="flex min-h-screen flex-col">
              <Nav />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
