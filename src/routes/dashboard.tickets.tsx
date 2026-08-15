import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Copy,
  Download,
  Mail,
  MessageCircle,
  Plane,
  QrCode,
  Share2,
} from "lucide-react";
import { addMinutes, format, isPast } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { Ticket as TicketType } from "@/lib/api";
import { getApiBase } from "@/lib/runtime-config";

function isTicketInactive(t: TicketType): boolean {
  if (t.isInactive || t.displayStatus === "inactive") return true;
  return isPast(addMinutes(new Date(t.departAt), 10));
}

export const Route = createFileRoute("/dashboard/tickets")({
  component: Tickets,
});

function Tickets() {
  const { account } = useAuth();
  const tickets = account?.tickets ?? [];
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [share, setShare] = useState<string | null>(null);

  const list = tickets.filter((t) => {
    const inactive = isTicketInactive(t);
    return tab === "upcoming" ? !inactive : inactive;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">
            My tickets
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            Boarding passes & itineraries.
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface p-1 text-sm font-medium">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 capitalize transition-colors ${
                tab === t ? "nav-active font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "upcoming"
              ? "No upcoming tickets. Book a flight and your boarding passes will appear here."
              : "No past tickets yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((t) => (
            <TicketCard key={t.id} t={t} onShare={() => setShare(t.id)} />
          ))}
        </div>
      )}

      {share && <ShareSheet onClose={() => setShare(null)} />}
    </div>
  );
}

function TicketCard({ t, onShare }: { t: TicketType; onShare: () => void }) {
  const depart = new Date(t.departAt);
  const arrive = new Date(t.arriveAt);
  const inactive = isTicketInactive(t);
  const active = !inactive && t.status !== "cancelled";

  return (
    <article
      className={`grid overflow-hidden rounded-2xl border bg-background shadow-[var(--shadow-glass)] md:grid-cols-[1fr_260px] ${
        inactive
          ? "border-hairline/60 opacity-55 grayscale"
          : "border-hairline"
      }`}
    >
      <div className="p-8">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            {t.airline}
            {t.flightLabel ? ` · ${t.flightLabel}` : ""}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
              inactive
                ? "bg-secondary text-muted-foreground"
                : t.status === "confirmed"
                  ? "bg-signal-soft text-signal"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {inactive ? "inactive" : t.status}
          </span>
        </div>

        {t.passengerNames && (
          <p className="mt-3 text-sm font-medium text-ink">
            Passenger{t.passengerNames.includes(",") ? "s" : ""}: {t.passengerNames}
          </p>
        )}

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <div>
            <div className="text-5xl font-semibold tracking-[-0.04em] text-ink">{t.originCode}</div>
            <div className="text-xs text-muted-foreground">{t.originCity}</div>
            <div className="mt-3 text-lg font-semibold text-ink">{format(depart, "HH:mm")}</div>
          </div>
          <div className="flex flex-col items-center pb-2 text-xs text-muted-foreground">
            <div className="flex w-24 items-center gap-1">
              <span className="h-px flex-1 bg-hairline" />
              <Plane className="h-4 w-4 rotate-90 text-signal" />
              <span className="h-px flex-1 bg-hairline" />
            </div>
            <span className="mt-1">{format(depart, "d MMM yyyy")}</span>
          </div>
          <div className="text-right">
            <div className="text-5xl font-semibold tracking-[-0.04em] text-ink">
              {t.destinationCode}
            </div>
            <div className="text-xs text-muted-foreground">{t.destinationCity}</div>
            <div className="mt-3 text-lg font-semibold text-ink">{format(arrive, "HH:mm")}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-hairline pt-6 md:grid-cols-4">
          <Cell k="Seat" v={t.seat ?? "—"} />
          <Cell k="Gate" v={t.gate ?? "TBD"} />
          <Cell k="Class" v={t.class} />
          <Cell k="Booking" v={t.pnr ?? t.bookingId.slice(0, 8).toUpperCase()} />
        </div>

        {active && (
          <div className="mt-6 flex flex-wrap gap-2">
            {t.documentUrl && (
              <button
                type="button"
                onClick={() => downloadTicketDoc(t.documentUrl!)}
                className="btn-ink inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" /> Download ticket
              </button>
            )}
            {!t.documentUrl && (
              <button type="button" className="btn-ink inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
            )}
            <button className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink hover:border-signal">
              <QrCode className="h-3.5 w-3.5" /> Mobile wallet
            </button>
            <button
              onClick={onShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink hover:border-signal"
            >
              <Share2 className="h-3.5 w-3.5" /> Share ticket
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink hover:border-signal">
              Manage <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-col justify-between border-t border-dashed border-hairline bg-surface p-8 md:border-l md:border-t-0">
        <div className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background md:block" />
        <div className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background md:block" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Boarding pass
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {t.originCode}→{t.destinationCode}
          </div>
          {t.passengerNames && (
            <div className="mt-1 text-xs text-muted-foreground">{t.passengerNames.split(",")[0]?.trim()}</div>
          )}
        </div>
        <div
          className="mt-6 h-24 w-full rounded-md"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 5px, var(--ink) 5px 8px, transparent 8px 10px, var(--ink) 10px 11px, transparent 11px 15px)",
          }}
          aria-label="Barcode"
        />
        <div className="mt-3 text-center font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          {t.seat ?? "—"}
        </div>
      </div>
    </article>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{v}</div>
    </div>
  );
}

async function downloadTicketDoc(path: string) {
  const token = localStorage.getItem("biazo-access-token");
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "biazo-ticket";
  a.click();
  URL.revokeObjectURL(url);
}

function ShareSheet({ onClose }: { onClose: () => void }) {
  const link = `biazo.travel/t/share`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-background p-6 shadow-[var(--shadow-lift)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-[-0.02em]">Share your ticket</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-ink">
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a read-only link. Recipient sees flight details, not payment info.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {(
            [
              [MessageCircle, "WhatsApp"],
              [Mail, "Email"],
              [Copy, "Copy link"],
            ] as const
          ).map(([Icon, label]) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-4 text-xs font-medium text-ink hover:border-signal"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-signal-soft text-signal">
                <Icon className="h-4 w-4" />
              </div>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 text-sm">
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{link}</span>
          <button className="btn-signal rounded-lg px-3 py-1.5 text-xs font-semibold">Copy</button>
        </div>
      </div>
    </div>
  );
}
