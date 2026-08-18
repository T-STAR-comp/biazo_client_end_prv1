import { createFileRoute, useSearch } from "@tanstack/react-router";
import { differenceInHours, format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentCheckout } from "@/components/payment-checkout";
import { QuoteBreakdown } from "@/components/quote-breakdown";
import { LoadingOverlay, LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/context/auth-context";
import { applicationsApi, paymentsApi, type FlightApplication } from "@/lib/api";

export const Route = createFileRoute("/dashboard/applications")({
  component: ApplicationsPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  in_review: "In review",
  awaiting_payment: "Quote ready",
  paid: "Payment received",
  purchasing: "Purchasing tickets",
  completed: "Completed",
  cancelled: "Cancelled",
};

function reassurance(app: FlightApplication) {
  const hours = differenceInHours(new Date(), new Date(app.updatedAt));
  if (["pending", "in_review"].includes(app.status) && hours >= 2) {
    return "Hang in there - we're still working on your request and will update you soon.";
  }
  if (app.status === "purchasing") {
    return "Your payment is confirmed. We're purchasing your tickets with the airline now.";
  }
  if (app.status === "awaiting_payment") {
    return app.isAlternateOffer
      ? "We found a close match with a few changes - review the quote below."
      : "Your requested flight is available - complete payment to confirm.";
  }
  return null;
}

function ApplicationsPage() {
  const { refreshAccount } = useAuth();
  const search = useSearch({ strict: false }) as {
    applicationId?: string;
    tx_ref?: string;
    status?: string;
    hosted?: string;
  };
  const [apps, setApps] = useState<FlightApplication[]>([]);
  const [selected, setSelected] = useState<FlightApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [returnMessage, setReturnMessage] = useState<string | null>(null);
  const [proofPending, setProofPending] = useState(false);
  const returnHandledRef = useRef<string | null>(null);

  const closeDetail = useCallback(() => {
    setSelected(null);
    setShowPay(false);
    setReturnMessage(null);
    setProofPending(false);
  }, []);

  const load = useCallback(async () => {
    const data = await applicationsApi.list();
    setApps(data.applications);
    setLoading(false);
  }, []);

  const openDetail = async (id: string) => {
    const data = await applicationsApi.get(id);
    setSelected(data.application);
    setShowPay(false);
    setProofPending(false);
    const active = await paymentsApi.getActiveForApplication(id);
    if (active.payment?.paymentMethod === "manual_transfer" && active.payment.proofReviewStatus === "submitted") {
      setProofPending(true);
      setShowPay(true);
    }
    return data.application;
  };

  const onPaymentComplete = useCallback(async (appId?: string) => {
    const id = appId ?? selected?.id;
    if (!id) return;
    setActionLoading(true);
    try {
      await load();
      await refreshAccount();
      const data = await applicationsApi.get(id);
      setSelected(data.application);
      setShowPay(false);
      setProofPending(false);
    } finally {
      setActionLoading(false);
    }
  }, [selected?.id, load, refreshAccount]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!search.applicationId || !search.tx_ref) return;
    const key = `${search.applicationId}:${search.tx_ref}`;
    if (returnHandledRef.current === key) return;
    returnHandledRef.current = key;

    void openDetail(search.applicationId).then(async () => {
      setActionLoading(true);
      try {
        const { payment, outcome, redirectStatus } = await paymentsApi.verifyReturn(
          search.tx_ref!,
          search.status,
        );
        if (payment.status === "completed") {
          setReturnMessage("Payment confirmed - thank you!");
          setShowPay(false);
          await onPaymentComplete(search.applicationId);
        } else if (
          payment.status === "failed" ||
          payment.status === "expired" ||
          redirectStatus?.toLowerCase() === "failed" ||
          search.hosted === "cancel"
        ) {
          setReturnMessage("Payment was not completed. You can try again.");
          setShowPay(false);
        } else if (outcome === "pending") {
          setReturnMessage(
            redirectStatus?.toLowerCase() === "success"
              ? "PayChangu reported success - confirming with our server…"
              : "Payment pending - we are confirming with PayChangu…",
          );
          setShowPay(true);
        } else {
          setReturnMessage("Could not confirm payment yet. We will keep checking.");
          setShowPay(true);
        }
      } catch {
        setReturnMessage("Could not verify payment. Contact support if you were charged.");
        setShowPay(false);
      } finally {
        setActionLoading(false);
      }
    });
  }, [search.applicationId, search.tx_ref, search.status, search.hosted, onPaymentComplete]);

  useEffect(() => {
    if (!search.applicationId || search.tx_ref) return;
    void openDetail(search.applicationId).then(async () => {
      const active = await paymentsApi.getActiveForApplication(search.applicationId!);
      if (active.payment?.status === "pending") {
        setShowPay(true);
      }
    });
  }, [search.applicationId, search.tx_ref]);

  const removeQuoteItem = async (itemId: string) => {
    if (!selected) return;
    setRemovingItemId(itemId);
    try {
      const { application } = await applicationsApi.removeQuoteItem(selected.id, itemId);
      setSelected(application);
      setShowPay(false);
      await load();
    } finally {
      setRemovingItemId(null);
    }
  };

  const cancel = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await applicationsApi.cancel(selected.id);
      setSelected(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Your requests</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">Applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track availability requests, quotes, and tickets.</p>
      </div>

      {loading ? (
        <LoadingScreen label="Loading applications" />
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline p-10 text-center text-sm text-muted-foreground">
          No applications yet. Submit a request from Book a flight.
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => openDetail(app.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-background p-5 text-left transition-colors hover:border-signal/40"
              >
                <div>
                  <p className="font-semibold">{app.originCode} → {app.destinationCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.referenceNumber} · {format(new Date(app.departDate), "d MMM yyyy")} · {app.passengers.length} pax
                  </p>
                </div>
                <StatusPill status={app.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => !actionLoading && closeDetail()}>
          <div
            className="modal-sheet relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {actionLoading && <LoadingOverlay label="Processing" />}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{selected.referenceNumber}</p>
                <h2 className="mt-1 text-xl font-semibold">{selected.originCity} → {selected.destinationCity}</h2>
                <StatusPill status={selected.status} proofPending={proofPending} />
              </div>
              <button type="button" onClick={closeDetail} className="text-muted-foreground hover:text-ink">✕</button>
            </div>

            {reassurance(selected) && (
              <p className="mt-4 rounded-xl bg-signal-soft px-4 py-3 text-sm">{reassurance(selected)}</p>
            )}

            <dl className="mt-6 space-y-2 text-sm">
              <Row label="Depart" value={`${selected.departDate} · ${selected.departTimePreferred}`} />
              {selected.quotedDepartDate && (
                <Row label="Quoted" value={`${selected.quotedDepartDate} · ${selected.quotedDepartTime ?? ""}${selected.quotedAirline ? ` · ${selected.quotedAirline}` : ""}`} />
              )}
              {selected.adminMessage && <Row label="From Biazo" value={selected.adminMessage} />}
            </dl>

            {selected.status === "awaiting_payment" && (
              <div className="mt-6 space-y-4 rounded-xl border border-hairline bg-surface p-4">
                {returnMessage && (
                  <p className="rounded-xl bg-signal-soft px-4 py-3 text-sm">{returnMessage}</p>
                )}
                <QuoteBreakdown
                  items={selected.quoteLineItems ?? []}
                  totalMwk={selected.totalPriceMwk}
                  exchangeRates={selected.quoteExchangeRates}
                  onRemove={showPay ? undefined : removeQuoteItem}
                  removingId={removingItemId}
                />
                {showPay && selected.status === "awaiting_payment" ? (
                  <PaymentCheckout
                    applicationId={selected.id}
                    amountMwk={selected.totalPriceMwk}
                    exchangeRates={selected.quoteExchangeRates}
                    onPaid={() => onPaymentComplete(selected.id)}
                    onProofSubmitted={() => setProofPending(true)}
                    onCancel={() => setShowPay(false)}
                  />
                ) : selected.status === "awaiting_payment" ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Remove optional add-ons above if you do not need them. Pay with travel credit or PayChangu when ready.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actionLoading} onClick={() => setShowPay(true)} className="btn-signal rounded-xl px-5 py-2.5 text-sm font-semibold">
                        Pay now
                      </button>
                      <button type="button" disabled={actionLoading} onClick={cancel} className="rounded-xl border border-hairline px-5 py-2.5 text-sm">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {selected.status === "completed" && (
              <p className="mt-6 text-sm text-muted-foreground">
                Your e-tickets are ready - view them in{" "}
                <a href="/dashboard/tickets" className="font-medium text-signal underline-offset-2 hover:underline">
                  My tickets
                </a>{" "}
                and on your dashboard home.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, proofPending }: { status: string; proofPending?: boolean }) {
  const label = proofPending ? "Payment proof under review" : (STATUS_LABELS[status] ?? status);
  return (
    <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
