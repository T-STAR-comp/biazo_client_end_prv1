import { useEffect, useState } from "react";
import { Gift, Loader2, PlusCircle, Search, Wallet } from "lucide-react";
import { FormattedPrice } from "@/components/currency-selector";
import { BuyTravelCreditCheckout } from "@/components/buy-travel-credit-checkout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { accountApi } from "@/lib/api";

type Recipient = { id: string; email: string; firstName: string; lastName: string };

type TravelCreditView = "balance" | "share" | "buy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: TravelCreditView;
};

export function TravelCreditModal({ open, onOpenChange, initialView = "balance" }: Props) {
  const { account, refreshAccount } = useAuth();
  const balanceMwk = account?.travelCreditMwk ?? 0;

  const [view, setView] = useState<TravelCreditView>(initialView);
  const [emailQuery, setEmailQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [amountMwk, setAmountMwk] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setView(initialView);
    }
  }, [open, initialView]);

  useEffect(() => {
    if (!open) {
      setView("balance");
      setEmailQuery("");
      setRecipients([]);
      setSelected(null);
      setAmountMwk("");
      setNote("");
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  useEffect(() => {
    if (view !== "share") return;
    const q = emailQuery.trim();
    if (q.length < 3) {
      setRecipients([]);
      setSelected(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const data = await accountApi.searchCreditRecipients(q);
        setRecipients(data.recipients);
        setSelected((current) =>
          current && data.recipients.some((r) => r.id === current.id) ? current : null,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setRecipients([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [emailQuery, view]);

  const shareCredits = async () => {
    if (!selected) {
      setError("Select a recipient from the search results");
      return;
    }
    const amount = Number(amountMwk);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > balanceMwk) {
      setError("Amount exceeds your available travel credit");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await accountApi.shareTravelCredit({
        recipientUserId: selected.id,
        amountMwk: amount,
        note: note.trim() || undefined,
      });
      setSuccess(result.message);
      await refreshAccount();
      setView("balance");
      setEmailQuery("");
      setRecipients([]);
      setSelected(null);
      setAmountMwk("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share credits");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-hairline bg-signal-soft/30 px-6 py-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-signal" />
              Travel credit
            </DialogTitle>
            <DialogDescription>Your Biazo wallet balance for flights and quotes.</DialogDescription>
          </DialogHeader>
          <p className="mt-4 text-3xl font-semibold text-ink">
            <FormattedPrice amountMwk={balanceMwk} />
          </p>
        </div>

        <div className="px-6 py-5">
          {view === "balance" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use travel credit at checkout when paying for a quoted application, buy more credits anytime, or share
                with another Biazo member. Credits are not withdrawable.
              </p>
              {success && (
                <p className="rounded-xl border border-signal/30 bg-signal-soft px-3 py-2 text-sm text-ink">{success}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setView("buy");
                }}
                className="btn-signal flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <PlusCircle className="h-4 w-4" />
                Buy credits
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setView("share");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-3 text-sm font-medium hover:bg-surface-elevated"
              >
                <Gift className="h-4 w-4 text-signal" />
                Share credits with someone
              </button>
            </div>
          ) : view === "buy" ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setView("balance")}
                className="text-xs font-medium text-muted-foreground hover:text-ink"
              >
                ← Back to balance
              </button>
              <BuyTravelCreditCheckout
                onComplete={async () => {
                  await refreshAccount();
                  setSuccess("Travel credit added to your balance.");
                  setView("balance");
                }}
                onCancel={() => setView("balance")}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setView("balance")}
                className="text-xs font-medium text-muted-foreground hover:text-ink"
              >
                ← Back to balance
              </button>

              <label className="block text-sm">
                <span className="text-muted-foreground">Find recipient by email or name</span>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={emailQuery}
                    onChange={(e) => setEmailQuery(e.target.value)}
                    placeholder="e.g. jane@email.com"
                    className="w-full rounded-xl border border-hairline py-2.5 pl-10 pr-3 text-sm"
                    autoFocus
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </label>

              {recipients.length > 0 && (
                <ul className="max-h-40 overflow-y-auto rounded-xl border border-hairline divide-y divide-hairline">
                  {recipients.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className={`flex w-full flex-col px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface ${
                          selected?.id === r.id ? "bg-signal-soft" : ""
                        }`}
                      >
                        <span className="font-medium text-ink">
                          {r.firstName} {r.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{r.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {emailQuery.trim().length >= 3 && !searching && recipients.length === 0 && (
                <p className="text-xs text-muted-foreground">No matching Biazo members found.</p>
              )}

              {selected && (
                <>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Amount (MWK)</span>
                    <input
                      type="number"
                      min="1"
                      max={balanceMwk}
                      value={amountMwk}
                      onChange={(e) => setAmountMwk(e.target.value)}
                      placeholder="10000"
                      className="mt-1 w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Note (optional)</span>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Birthday gift, group trip…"
                      className="mt-1 w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                    />
                  </label>
                </>
              )}

              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

              <button
                type="button"
                onClick={shareCredits}
                disabled={submitting || !selected || !amountMwk}
                className="btn-signal w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Sharing…" : "Share credits"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
