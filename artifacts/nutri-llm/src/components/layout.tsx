import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, BookmarkCheck, Scale } from "lucide-react";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/foods", label: "Catalog" },
  { href: "/tracker", label: "Tracker" },
  { href: "/compare", label: "Compare" },
  { href: "/hub", label: "Hub" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-14 items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-4 sm:mr-6 flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
              <span className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight">NutriLLM</span>
            </Link>
          </div>

          <nav className="hidden sm:flex flex-1 items-center gap-1 text-sm font-medium">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location === href
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {label === "Tracker" && <BookmarkCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5 opacity-70" />}
                {label === "Compare" && <Scale className="inline h-3.5 w-3.5 mr-1 -mt-0.5 opacity-70" />}
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <button
              className="sm:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t border-border/40 bg-background">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location === href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-muted/20 py-4 md:py-0">
        <div className="w-full flex flex-col items-center justify-between gap-3 md:h-14 md:flex-row px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Global Food Intelligence — powered by <span className="text-primary font-medium">NutriLLM</span>
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/tracker" className="hover:text-primary transition-colors">Tracker</Link>
            <Link href="/compare" className="hover:text-primary transition-colors">Compare</Link>
            <Link href="/docs" className="hover:text-primary transition-colors">API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
