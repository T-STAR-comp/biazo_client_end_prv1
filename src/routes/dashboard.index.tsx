import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, Plane, Search, Ticket } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { Booking } from "@/lib/api";
import { applicationsApi, type FlightApplication } from "@/lib/api";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user, account, refreshAccount } = useAuth();
  const [applications, setApplications] = useState<FlightApplication[]>([]);
  const bookings = account?.bookings ?? [];
  const now = new Date();

  useEffect(() => {
    applicationsApi.list().then((d) => setApplications(d.applications)).catch(() => null);
    refreshAccount().catch(() => null);
  }, [refreshAccount]);

  const activeApp = applications.find((a) =>
    ["pending", "in_review", "awaiting_payment", "paid", "purchasing"].includes(a.status),
  );

  const upcoming = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.departAt) > now)
    .sort((a, b) => new Date(a.departAt).getTime() - new Date(b.departAt).getTime())[0];

  const past = bookings
    .filter((b) => b.status === "completed" || isPast(new Date(b.departAt)))
    .sort((a, b) => new Date(b.departAt).getTime() - new Date(a.departAt).getTime())
    .slice(0, 5);

  const firstName = user?.firstName ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">
            {greeting}, {firstName}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            {upcoming ? (
              <>
                {upcoming.destinationCity} in{" "}
                <span className="text-display">
                  {formatDistanceToNow(new Date(upcoming.departAt), { addSuffix: false })}.
                </span>
              </>
            ) : activeApp ? (
              <>
                {activeApp.destinationCity} application{" "}
                <span className="text-display">{activeApp.status.replace(/_/g, " ")}.</span>
              </>
            ) : (
              <>Ready for your next trip?</>
            )}
          </h1>
        </div>
      </div>

      {activeApp && (
        <Link
          to="/dashboard/applications"
          className="block rounded-2xl border border-signal/30 bg-signal-soft p-5 text-sm transition-colors hover:border-signal"
        >
          <p className="font-semibold text-ink">{activeApp.referenceNumber} · {activeApp.originCode} → {activeApp.destinationCode}</p>
          <p className="mt-1 text-muted-foreground">
            {activeApp.status === "awaiting_payment"
              ? "Your quote is ready — review and pay in Applications."
              : "We're processing your request. Tap for live status."}
          </p>
        </Link>
      )}

      {upcoming ? (
        <UpcomingCard booking={upcoming} />
      ) : (
        <EmptyUpcoming />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-hairline bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Past trips</h2>
            {past.length > 0 && (
              <Link to="/dashboard/tickets" className="text-xs font-medium text-signal">
                See all →
              </Link>
            )}
          </div>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No past trips yet. Book your first flight from Lilongwe or Blantyre.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {past.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {t.originCode} → {t.destinationCode}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.airline} · {format(new Date(t.departAt), "d MMM yyyy")}
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-hairline bg-signal-soft p-6">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Book from Malawi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search flights from Lilongwe (LLW) or Chileka, Blantyre (BLZ) to destinations across
            Africa and beyond.
          </p>
          <Link
            to="/dashboard/book"
            className="btn-ink mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <Search className="h-3.5 w-3.5" /> Apply for a flight
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingCard({ booking }: { booking: Booking }) {
  const depart = new Date(booking.departAt);
  const arrive = new Date(booking.arriveAt);

  return (
    <article className="relative overflow-hidden rounded-3xl bg-ink text-ivory shadow-[var(--shadow-lift)]">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-signal/30" />
      <div className="relative p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-signal px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-foreground">
            Next trip · {formatDistanceToNow(depart, { addSuffix: true })}
          </span>
          <span className="text-xs uppercase tracking-[0.16em] text-white/70">PNR · {booking.pnr}</span>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/60">Departure</div>
            <div className="mt-1 text-6xl font-semibold tracking-[-0.04em] md:text-7xl">
              {booking.originCode}
            </div>
            <div className="mt-1 text-sm text-white/80">{booking.originCity}</div>
            <div className="mt-3 text-xl font-semibold">{format(depart, "HH:mm")}</div>
            <div className="text-xs text-white/60">{format(depart, "EEE, d MMM yyyy")}</div>
          </div>

          <div className="flex flex-col items-center pb-2 text-xs text-white/60">
            <div className="my-2 flex w-32 items-center gap-1">
              <span className="h-px flex-1 bg-white/30" />
              <Plane className="h-4 w-4 rotate-90 text-signal" />
              <span className="h-px flex-1 bg-white/30" />
            </div>
            <span>
              {booking.airline}
              {booking.flightNumber ? ` · ${booking.flightNumber}` : ""}
            </span>
          </div>

          <div className="md:text-right">
            <div className="text-xs uppercase tracking-[0.16em] text-white/60">Arrival</div>
            <div className="mt-1 text-6xl font-semibold tracking-[-0.04em] md:text-7xl">
              {booking.destinationCode}
            </div>
            <div className="mt-1 text-sm text-white/80">{booking.destinationCity}</div>
            <div className="mt-3 text-xl font-semibold">{format(arrive, "HH:mm")}</div>
            <div className="text-xs text-white/60">{format(arrive, "EEE, d MMM yyyy")}</div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <Stat label="Class" value={booking.cabinClass} />
            <Stat label="Status" value={booking.status} />
          </div>
          <div className="flex gap-2">
            <Link
              to="/dashboard/tickets"
              className="btn-signal inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <Ticket className="h-4 w-4" /> View ticket
            </Link>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10">
              Manage <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyUpcoming() {
  return (
    <div className="rounded-3xl border border-dashed border-hairline bg-background p-10 text-center md:p-14">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-signal-soft text-signal">
        <MapPin className="h-6 w-6" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">No upcoming trips</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        When you book through Biazo, your next flight appears here with gate, seat, and boarding
        pass details.
      </p>
      <Link
        to="/dashboard/book"
        className="btn-signal mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
      >
        <Search className="h-4 w-4" /> Book a flight
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
      <div className="mt-0.5 text-base font-semibold capitalize">{value}</div>
    </div>
  );
}

