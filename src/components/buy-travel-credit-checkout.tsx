import { useCallback, useEffect, useState } from "react";
import { Building2, CreditCard, ExternalLink, Loader2, Smartphone } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-screen";
import { FormattedPrice } from "@/components/currency-selector";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";
import { formatPriceFromMwk, resolvePaymentCurrency } from "@/lib/currencies";
import { paymentsApi, type PaymentConfig, type PaymentLedger, type MomoOperator } from "@/lib/api";

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

type Props = {
  onComplete: () => void;
  onCancel: () => void;
};

type Method = "mobile_money" | "bank" | "card";

export function BuyTravelCreditCheckout({ onComplete, onCancel }: Props) {
  const { account, refreshAccount } = useAuth();
  const { effectiveCurrency } = useCurrency();
  const [amountMwk, setAmountMwk] = useState("200000");
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<Method>("mobile_money");
  const [operators, setOperators] = useState<MomoOperator[]>([]);
  const [payment, setPayment] = useState<PaymentLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const [mobile, setMobile] = useState("");
  const [operatorRefId, setOperatorRefId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const parsedAmount = Number(amountMwk);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount >= 1000;
  const paymentCurrency = resolvePaymentCurrency(effectiveCurrency);
  const showPaymentNote = effectiveCurrency !== paymentCurrency;
  const formatDisplay = (mwk: number) => formatPriceFromMwk(mwk, effectiveCurrency);
  const isHosted = config?.checkoutMode === "hosted";

  useEffect(() => {
    paymentsApi.getConfig().then(setConfig).catch(() => setConfig({ checkoutMode: "direct", mockMode: true }));
    paymentsApi.getActiveCreditPurchase().then((d) => {
      if (d.payment) {
        setPayment(d.payment);
        setAmountMwk(String(d.payment.amountMwk));
        if (d.payment.status === "completed") {
          void refreshAccount().then(onComplete);
        }
      }
    });
  }, [onComplete, refreshAccount]);

  useEffect(() => {
    if (!isHosted) {
      paymentsApi.getOperators().then((d) => {
        setOperators(d.operators);
        if (d.operators[0]) setOperatorRefId(d.operators[0].ref_id);
      });
    }
  }, [isHosted]);

  useEffect(() => {
    if (account?.user.phone) setMobile(account.user.phone.replace(/\s/g, ""));
    if (account?.user) {
      setCardholderName(`${account.user.firstName} ${account.user.lastName}`);
    }
  }, [account]);

  const purchaseBody = () => ({
    amountMwk: parsedAmount,
    displayCurrency: effectiveCurrency,
  });

  const pollStatus = useCallback(
    async (ledgerId: string) => {
      setPolling(true);
      try {
        const { payment: p } = await paymentsApi.get(ledgerId);
        setPayment(p);
        if (p.status === "completed") {
          await refreshAccount();
          onComplete();
          return;
        }
        if (p.status === "failed" || p.status === "expired") {
          setError(
            p.status === "expired"
              ? "Payment window expired. Please try again."
              : "Payment failed. Please try again.",
          );
          setPayment(null);
        }
      } finally {
        setPolling(false);
      }
    },
    [onComplete, refreshAccount],
  );

  useEffect(() => {
    if (!payment || payment.status !== "pending") return;
    const timer = setInterval(() => {
      void pollStatus(payment.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [payment, pollStatus]);

  const payHosted = async () => {
    if (!validAmount) {
      setError("Enter at least MWK 1,000");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsApi.purchaseTravelCredits({
        method: "hosted_checkout",
        ...purchaseBody(),
      });
      setPayment(result.payment);
      const url = result.checkoutUrl ?? result.payment.checkoutUrl;
      if (url && !result.resumed) {
        window.location.href = url;
        return;
      }
      if (!url) {
        setError("PayChangu did not return a checkout link. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (!validAmount) {
      setError("Enter at least MWK 1,000");
      return;
    }
    if (isHosted) {
      await payHosted();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (method === "mobile_money") {
        const result = await paymentsApi.purchaseTravelCredits({
          method: "mobile_money",
          ...purchaseBody(),
          mobile,
          operatorRefId,
        });
        setPayment(result.payment);
      } else if (method === "bank") {
        const result = await paymentsApi.purchaseTravelCredits({ method: "bank", ...purchaseBody() });
        setPayment(result.payment);
      } else {
        const result = await paymentsApi.purchaseTravelCredits({
          method: "card",
          ...purchaseBody(),
          cardNumber,
          expiry,
          cvv,
          cardholderName,
          redirectUrl: `${window.location.origin}/dashboard?creditPurchase=callback`,
        });
        if (result.requires3ds && result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        setPayment(result.payment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (payment?.status === "completed") {
    return (
      <div className="space-y-4 rounded-xl border border-signal/30 bg-signal-soft/30 p-5">
        <p className="text-sm font-semibold text-signal">Credits added to your balance!</p>
        <p className="text-sm text-muted-foreground">
          MWK {payment?.amountMwk.toLocaleString() ?? parsedAmount.toLocaleString()} is now available for flights and
          quotes.
        </p>
        <button type="button" onClick={onComplete} className="btn-signal rounded-xl px-4 py-2.5 text-sm font-semibold">
          Done
        </button>
      </div>
    );
  }

  if (payment?.status === "pending") {
    return (
      <div className="relative space-y-4">
        {polling && <LoadingOverlay label="Checking payment" />}
        <div className="space-y-4 rounded-xl border border-signal/30 bg-signal-soft/20 p-5">
          <div className="flex items-center gap-2 text-signal">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-semibold">Waiting for PayChangu payment…</span>
          </div>
          <p className="text-lg font-semibold">{formatDisplay(payment.amountMwk)}</p>
          {payment.checkoutUrl && (
            <a
              href={payment.checkoutUrl}
              className="inline-flex items-center gap-2 text-sm font-medium text-signal underline-offset-2 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Re-open PayChangu checkout
            </a>
          )}
          {payment.bankDetails && (
            <dl className="space-y-2 rounded-xl bg-background p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Bank</dt>
                <dd>{payment.bankDetails.bankName ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="font-mono">{payment.bankDetails.accountNumber ?? "-"}</dd>
              </div>
            </dl>
          )}
          <button type="button" onClick={() => setPayment(null)} className="text-xs text-muted-foreground underline">
            Start a new payment attempt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {loading && <LoadingOverlay label="Starting payment" />}

      <p className="text-sm text-muted-foreground">
        Top up your wallet via PayChangu. Credits are shareable but cannot be withdrawn. You receive the full kwacha amount
        you pay for.
      </p>

      <label className="block text-sm">
        <span className="text-muted-foreground">Amount to buy (MWK)</span>
        <input
          type="number"
          min={1000}
          step={1000}
          value={amountMwk}
          onChange={(e) => setAmountMwk(e.target.value)}
          className="mt-1 w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmountMwk(String(preset))}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              parsedAmount === preset ? "border-signal bg-signal-soft text-signal" : "border-hairline"
            }`}
          >
            {preset.toLocaleString()}
          </button>
        ))}
      </div>

      {validAmount && (
        <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">You pay</p>
          <p className="text-xl font-semibold">{formatDisplay(parsedAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You receive <FormattedPrice amountMwk={parsedAmount} /> in travel credit
          </p>
          {showPaymentNote && (
            <p className="mt-1 text-xs text-muted-foreground">
              PayChangu will charge in {paymentCurrency}.
            </p>
          )}
        </div>
      )}

      {isHosted ? (
        <>
          <p className="text-sm text-muted-foreground">
            Continue to PayChangu to pay with mobile money, bank transfer, or card (MWK or USD).
          </p>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={payHosted}
              disabled={loading || !validAmount}
              className="btn-signal flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {loading ? "Redirecting…" : "Continue to PayChangu"}
            </button>
            <button type="button" onClick={onCancel} className="rounded-xl border border-hairline px-4 py-3 text-sm">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            {(
              [
                ["mobile_money", "Mobile money", Smartphone],
                ["bank", "Bank", Building2],
                ["card", "Card", CreditCard],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium ${
                  method === m ? "border-signal bg-signal-soft text-signal" : "border-hairline"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {method === "mobile_money" && (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-muted-foreground">Network</span>
                <select
                  value={operatorRefId}
                  onChange={(e) => setOperatorRefId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                >
                  {operators.map((o) => (
                    <option key={o.ref_id} value={o.ref_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Mobile number</span>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="0991234567"
                  className="mt-1 w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                />
              </label>
            </div>
          )}

          {method === "card" && (
            <div className="space-y-3">
              <input
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Cardholder name"
                className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
              />
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Card number"
                className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                />
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                  className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={pay}
              disabled={loading || !validAmount}
              className="btn-signal flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Processing…" : validAmount ? `Pay ${formatDisplay(parsedAmount)}` : "Enter amount"}
            </button>
            <button type="button" onClick={onCancel} className="rounded-xl border border-hairline px-4 py-3 text-sm">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
