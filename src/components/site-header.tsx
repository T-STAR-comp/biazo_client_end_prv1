import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "./logo";
import { CurrencySelector } from "./currency-selector";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";

const nav = [
  { to: "/", label: "Explore" },
  { to: "/book", label: "Book" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const linkClass = overlay
    ? "rounded-xl px-4 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10"
    : "rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  const activeClass = overlay ? "bg-white/15 text-white" : "nav-active font-semibold text-foreground";

  const themeButtonClass = overlay
    ? "text-white/90 hover:bg-white/10"
    : "text-foreground hover:bg-secondary";

  return (
    <>
      <header
        className={
          overlay
            ? "absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-md"
            : "sticky top-0 z-40 border-b border-hairline glass-panel"
        }
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 pr-[max(1rem,env(safe-area-inset-right))] sm:h-16 sm:gap-3 sm:px-6">
          <Link to="/" className="min-w-0 shrink-0" onClick={() => setMenuOpen(false)}>
            <Logo light={overlay} compact />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  overlay
                    ? "rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                }
                activeProps={{
                  className: overlay ? "bg-white/15 text-white" : "bg-secondary text-foreground",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className={`touch-target hidden items-center justify-center rounded-xl sm:inline-flex ${themeButtonClass}`}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <CurrencySelector variant={overlay ? "overlay" : "default"} className="hidden sm:flex" />

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={
                    overlay
                      ? "hidden min-h-[44px] items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-white/90 md:inline-flex"
                      : "btn-ink hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium md:inline-flex"
                  }
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className={
                    overlay
                      ? "hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:inline-flex"
                      : "hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink md:inline-flex"
                  }
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className={
                    overlay
                      ? "hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:inline-flex"
                      : "hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-secondary md:inline-flex"
                  }
                >
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className={
                    overlay
                      ? "hidden min-h-[44px] items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-white/90 md:inline-flex"
                      : "btn-ink hidden min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium md:inline-flex"
                  }
                >
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`touch-target inline-flex shrink-0 items-center justify-center rounded-xl md:hidden ${themeButtonClass}`}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col ${
              overlay ? "bg-ink/95 text-white" : "bg-background"
            }`}
          >
            <div className="flex h-14 items-center justify-between border-b border-hairline px-4 pr-[max(1rem,env(safe-area-inset-right))] sm:h-16">
              <Logo light={overlay} />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="touch-target inline-flex items-center justify-center rounded-xl"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="touch-target inline-flex items-center justify-center rounded-xl"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto p-4">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={linkClass}
                  activeProps={{ className: activeClass }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-hairline pt-4">
                <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Display currency
                </p>
                <div className="px-4">
                  <CurrencySelector variant={overlay ? "overlay" : "default"} className="w-full" />
                </div>
              </div>
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-hairline p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="btn-signal touch-target flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Dashboard{user?.firstName ? ` · ${user.firstName}` : ""}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className={`touch-target flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium ${
                      overlay
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-hairline text-ink hover:bg-secondary"
                    }`}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className={`touch-target flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium ${
                      overlay
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-hairline text-ink hover:bg-secondary"
                    }`}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    onClick={() => setMenuOpen(false)}
                    className="btn-signal touch-target flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
