import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const cols = [
  {
    title: "Travel",
    links: [
      { to: "/book", label: "Search flights" },
      { to: "/", label: "Destinations" },
      { to: "/dashboard", label: "My trips" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Biazo" },
      { to: "/about", label: "Careers" },
      { to: "/about", label: "Press" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms of service" },
      { to: "/legal", label: "Privacy & legal" },
      { to: "/legal", label: "Cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 md:grid-cols-[2fr_3fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-6">
            Biazo is a modern traveling agency built for people who move with intention.
            Explore beyond the boundaries.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:mt-6">
            Lilongwe · Blantyre · Nairobi
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 sm:py-6 sm:text-left">
          <span>© 2026 Biazo Traveling Agency. Explore beyond the boundaries.</span>
          <span>Built with intention.</span>
        </div>
      </div>
    </footer>
  );
}
