import { useCallback, useEffect, useState } from "react";
import { Building2, CreditCard, ExternalLink, Loader2, Smartphone, Wallet } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-screen";
import { useAuth } from "@/context/auth-context";
import { useTravelCreditUi } from "@/context/travel-credit-ui-context";
import { useCurrency } from "@/context/currency-context";
import { formatPriceFromMwk, resolvePaymentCurrency } from "@/lib/currencies";
import { paymentsApi, type PaymentConfig, type PaymentLedger, type MomoOperator } from "@/lib/api";

type Props = {
  applicationId: string;
  amountMwk: number;
  exchangeRates?: Record<string, number>;
  onPaid: () => void;
  onCancel: () => void;
};

type Method = "mobile_money" | "bank" | "card";

export function PaymentCheckout({ applicationId, amountMwk, exchangeRates, onPaid, onCancel }: Props) {
  const { account } = useAuth();
  const { openTravelCredits } = useTravelCreditUi();
  const { effectiveCurrency } = useCurrency();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<Method>("mobile_money");
  const [operators, setOperators] = useState<MomoOperator[]>([]);
  const [payment, setPayment] = useState<PaymentLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [payMode, setPayMode] = useState<"paychangu" | "travel_credit">("paychangu");

  const [mobile, setMobile] = useState("");
  const [operatorRefId, setOperatorRefId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const paymentCurrency = resolvePaymentCurrency(effectiveCurrency);
  const formatDisplay = (mwk: number) => formatPriceFromMwk(mwk, effectiveCurrency, exchangeRates);
  const showPaymentNote = effectiveCurrency !== paymentCurrency;
  const travelCreditMwk = account?.travelCreditMwk ?? 0;
  const canPayWithCredit = travelCreditMwk >= amountMwk;

  const isHosted = config?.checkoutMode === "hosted";

  useEffect(() => {
    paymentsApi.getConfig().then(setConfig).catch(() => setConfig({ checkoutMode: "direct", mockMode: true }));
    paymentsApi.getActiveForApplication(applicationId).then((d) => {
      if (d.payment) {
        setPayment(d.payment);
        if (d.payment.status === "completed") onPaid();
      }
    });
  }, [applicationId, onPaid]);

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

  useEffect(() => {
    if (canPayWithCredit) setPayMode("travel_credit");
  }, [canPayWithCredit]);

  const payModeToggle =
    travelCreditMwk > 0 ? (
      <div className="flex gap-2 rounded-xl border border-hairline bg-surface p-1">
        <button
          type="button"
          onClick={() => setPayMode("travel_credit")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
            payMode === "travel_credit" ? "bg-signal text-signal-foreground" : "text-muted-foreground"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Travel credit
        </button>
        <button
          type="button"
          onClick={() => setPayMode("paychangu")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
            payMode === "paychangu" ? "nav-active font-semibold text-foreground" : "text-muted-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          PayChangu
        </button>
      </div>
    ) : null;

  const pollStatus = useCallback(
    async (ledgerId: string) => {
      setPolling(true);
      try {
        const { payment: p } = await paymentsApi.get(ledgerId);
        setPayment(p);
        if (p.status === "completed") {
          onPaid();
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
    [onPaid],
  );

  useEffect(() => {
    if (!payment || payment.status !== "pending") return;
    const timer = setInterval(() => {
      void pollStatus(payment.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [payment, pollStatus]);

  const initiateBody = () => ({
    applicationId,
    displayCurrency: effectiveCurrency,
  });

  const payWithTravelCredit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsApi.payWithTravelCredit({
        applicationId,
        displayCurrency: effectiveCurrency,
      });
      setPayment(result.payment);
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pay with travel credit");
    } finally {
      setLoading(false);
    }
  };

  const payHosted = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsApi.initiate({
        method: "hosted_checkout",
        ...initiateBody(),
      });
      setPayment(result.payment);
      const url = result.checkoutUrl ?? result.payment.checkoutUrl;
      if (url && result.resumed) {
        return;
      }
      if (url) {
        window.location.href = url;
        return;
      }
      setError("PayChangu did not return a checkout link. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (isHosted) {
      await payHosted();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (method === "mobile_money") {
        const result = await paymentsApi.initiate({
          method: "mobile_money",
          ...initiateBody(),
          mobile,
          operatorRefId,
        });
        setPayment(result.payment);
      } else if (method === "bank") {
        const result = await paymentsApi.initiate({ method: "bank", ...initiateBody() });
        setPayment(result.payment);
      } else {
        const result = await paymentsApi.initiate({
          method: "card",
          ...initiateBody(),
          cardNumber,
          expiry,
          cvv,
          cardholderName,
          redirectUrl: `${window.location.origin}/dashboard/applications?applicationId=${applicationId}`,
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
        <p className="text-sm font-semibold text-signal">Payment confirmed — thank you!</p>
        <button type="button" onClick={onCancel} className="rounded-xl border border-hairline px-4 py-2.5 text-sm">
          Close
        </button>
      </div>
    );
  }

  if (payMode === "travel_credit" && travelCreditMwk > 0 && !payment) {
    return (
      <div className="relative space-y-5">
        {loading && <LoadingOverlay label="Processing payment" />}
        <AmountDue
          amountMwk={amountMwk}
          formatDisplay={formatDisplay}
          showPaymentNote={showPaymentNote}
          paymentCurrency={paymentCurrency}
          displayCurrency={effectiveCurrency}
        />
        {payModeToggle}
        <TravelCreditPanel
          balanceMwk={travelCreditMwk}
          amountMwk={amountMwk}
          formatDisplay={formatDisplay}
          canPay={canPayWithCredit}
          loading={loading}
          onPay={payWithTravelCredit}
          onBuyCredits={() => openTravelCredits("buy")}
        />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <button type="button" onClick={onCancel} className="w-full rounded-xl border border-hairline px-4 py-3 text-sm">
          Cancel
        </button>
      </div>
    );
  }

  if (payment?.status === "pending") {
    return (
      <div className="relative space-y-4">
        {polling && <LoadingOverlay label="Checking payment" />}
        <PendingPaymentView
          payment={payment}
          amountMwk={amountMwk}
          exchangeRates={exchangeRates}
          displayCurrency={effectiveCurrency}
          onRetry={() => setPayment(null)}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (isHosted) {
    return (
      <div className="relative space-y-5">
        {loading && <LoadingOverlay label="Starting payment" />}
        <AmountDue
          amountMwk={amountMwk}
          formatDisplay={formatDisplay}
          showPaymentNote={showPaymentNote}
          paymentCurrency={paymentCurrency}
          displayCurrency={effectiveCurrency}
        />
        {payModeToggle}
        {payMode === "paychangu" ? (
          <>
            <p className="text-sm text-muted-foreground">
              You will be redirected to PayChangu secure checkout to pay with mobile money, bank transfer, or card.
            </p>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={payHosted}
                disabled={loading}
                className="btn-signal flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
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
            <TravelCreditPanel
              balanceMwk={travelCreditMwk}
              amountMwk={amountMwk}
              formatDisplay={formatDisplay}
              canPay={canPayWithCredit}
              loading={loading}
              onPay={payWithTravelCredit}
              onBuyCredits={() => openTravelCredits("buy")}
            />
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            <button type="button" onClick={onCancel} className="w-full rounded-xl border border-hairline px-4 py-3 text-sm">
              Cancel
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      {loading && <LoadingOverlay label="Starting payment" />}
      <AmountDue
        amountMwk={amountMwk}
        formatDisplay={formatDisplay}
        showPaymentNote={showPaymentNote}
        paymentCurrency={paymentCurrency}
        displayCurrency={effectiveCurrency}
      />

      {payModeToggle}

      {payMode === "paychangu" && (
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
          <p className="text-sm text-muted-foreground">
            Enter your mobile money number. A PIN prompt will be sent to your phone.
          </p>
          <Field label="Network">
            <select
              value={operatorRefId}
              onChange={(e) => setOperatorRefId(e.target.value)}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
            >
              {operators.map((o) => (
                <option key={o.ref_id} value={o.ref_id}>{o.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Mobile number">
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="0991234567"
              className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm"
            />
          </Field>
        </div>
      )}

      {method === "bank" && (
        <p className="text-sm text-muted-foreground">
          We will generate unique bank transfer details. You have 10 minutes to complete the transfer — we confirm automatically.
        </p>
      )}

      {method === "card" && (
        <div className="space-y-3">
          <Field label="Cardholder name">
            <input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
          </Field>
          <Field label="Card number">
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry (MM/YY)">
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12/30" className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
            </Field>
            <Field label="CVV">
              <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm" />
            </Field>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={pay} disabled={loading} className="btn-signal flex-1 rounded-xl py-3 text-sm font-semibold">
          {loading ? "Processing…" : `Pay ${formatDisplay(amountMwk)}`}
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

function TravelCreditPanel({
  balanceMwk,
  amountMwk,
  formatDisplay,
  canPay,
  loading,
  onPay,
  onBuyCredits,
}: {
  balanceMwk: number;
  amountMwk: number;
  formatDisplay: (mwk: number) => string;
  canPay: boolean;
  loading: boolean;
  onPay: () => void;
  onBuyCredits: () => void;
}) {
  return (
    <div className="rounded-xl border border-signal/30 bg-signal-soft/20 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal text-signal-foreground">
          <Wallet className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Travel credit</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Available: {formatDisplay(balanceMwk)}
            {!canPay && (
              <span>
                {" "}
                · You need {formatDisplay(amountMwk - balanceMwk)} more to cover this quote.{" "}
                <button
                  type="button"
                  onClick={onBuyCredits}
                  className="font-medium text-signal underline-offset-2 hover:underline"
                >
                  Buy credits
                </button>
              </span>
            )}
          </p>
          {canPay && (
            <button
              type="button"
              onClick={onPay}
              disabled={loading}
              className="btn-signal mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Processing…" : `Pay ${formatDisplay(amountMwk)} with travel credit`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AmountDue({
  formatDisplay,
  amountMwk,
  showPaymentNote,
  paymentCurrency,
  displayCurrency,
}: {
  formatDisplay: (mwk: number) => string;
  amountMwk: number;
  showPaymentNote: boolean;
  paymentCurrency: string;
  displayCurrency: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount due</p>
      <p className="text-3xl font-semibold">{formatDisplay(amountMwk)}</p>
      {showPaymentNote && (
        <p className="mt-1 text-xs text-muted-foreground">
          Shown in {displayCurrency}. PayChangu will charge in {paymentCurrency}.
        </p>
      )}
    </div>
  );
}

function PendingPaymentView({
  payment,
  amountMwk,
  exchangeRates,
  displayCurrency,
  onRetry,
  onCancel,
}: {
  payment: PaymentLedger;
  amountMwk: number;
  exchangeRates?: Record<string, number>;
  displayCurrency: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const expires = new Date(payment.expiresAt);
  const methodLabel =
    payment.paymentMethod === "mobile_money"
      ? "Mobile money"
      : payment.paymentMethod === "bank"
        ? "Bank transfer"
        : payment.paymentMethod === "hosted_checkout"
          ? "PayChangu checkout"
          : payment.paymentMethod === "travel_credit"
            ? "Travel credit"
            : "Card";

  const displayAmount = formatPriceFromMwk(amountMwk, displayCurrency, exchangeRates);

  return (
    <div className="space-y-4 rounded-xl border border-signal/30 bg-signal-soft/20 p-5">
      <div className="flex items-center gap-2 text-signal">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-semibold">Waiting for {methodLabel} payment…</span>
      </div>

      <p className="text-sm text-muted-foreground">
        {payment.paymentMethod === "mobile_money" &&
          `Approve the PIN prompt on ${payment.mobileNumber ?? "your phone"}.`}
        {payment.paymentMethod === "bank" && "Transfer the exact amount to the account below."}
        {payment.paymentMethod === "card" && "Confirming your card payment with PayChangu…"}
        {payment.paymentMethod === "hosted_checkout" &&
          "Complete payment on the PayChangu checkout page. We will confirm automatically when you return."}
      </p>

      <p className="text-lg font-semibold">{displayAmount}</p>

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
          <Row label="Bank" value={payment.bankDetails.bankName ?? "—"} />
          <Row label="Account number" value={payment.bankDetails.accountNumber ?? "—"} mono />
          <Row label="Account name" value={payment.bankDetails.accountName ?? "—"} />
        </dl>
      )}

      <p className="text-xs text-muted-foreground">
        Verification window until {expires.toLocaleTimeString()}. We check automatically every few seconds.
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className="text-xs text-muted-foreground underline">
          Start a new payment attempt
        </button>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-signal underline">
          Close payment
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
