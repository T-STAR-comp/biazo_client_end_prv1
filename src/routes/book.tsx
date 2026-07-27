import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlightSearch } from "@/components/flight-search";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, Search, SortAsc } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a flight — Biazo" },
      { name: "description", content: "Search and book flights with Biazo Traveling Agency." },
    ],
  }),
  component: Book,
});

function Book() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground sm:mb-6">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <span>Search flights</span>
        </div>

        <FlightSearch onSearch={() => setSearched(true)} />

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[280px_1fr] lg:gap-8">
          <aside className="hidden space-y-6 lg:block">
            <FiltersPanel disabled={!searched} />
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                  {searched ? "Flight results" : "Search flights from Malawi"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searched
                    ? "Live inventory connects when you sign in and book through Biazo."
                    : "Enter your route above — Lilongwe, Blantyre, and regional hubs."}
                </p>
              </div>
              {searched && (
                <div className="flex flex-wrap items-center gap-2">
                  <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-ink lg:hidden"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FiltersPanel disabled={false} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-hairline bg-surface-elevated p-1 text-xs font-medium">
                    {["Best", "Cheapest", "Fastest"].map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        className={`inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-2 ${
                          i === 0 ? "bg-ink text-ivory" : "text-muted-foreground hover:text-ink"
                        }`}
                      >
                        <SortAsc className="h-3 w-3 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!searched ? (
              <div className="rounded-2xl border border-dashed border-hairline bg-surface p-10 text-center sm:p-14">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-signal-soft text-signal">
                  <Search className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Run a search to see available fares. Sign in to book with your saved preferences
                  and payment methods.
                </p>
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="btn-signal mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Sign in to Biazo
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-hairline bg-surface-elevated p-8 text-center sm:p-12">
                <p className="text-sm text-muted-foreground">
                  No live flight inventory in this preview. Create a Biazo account and our concierge
                  will quote and ticket your route within minutes.
                </p>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="btn-ink mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function FiltersPanel({ disabled }: { disabled: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-surface-elevated p-4 sm:p-5 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <Filter className="h-4 w-4" /> Filters
      </div>
      <p className="text-xs text-muted-foreground">
        Filters apply once flight results are available.
      </p>
    </div>
  );
}
