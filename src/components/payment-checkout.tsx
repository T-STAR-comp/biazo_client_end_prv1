import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, CreditCard, ExternalLink, Loader2, Smartphone, Wallet } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-screen";
import { useAuth } from "@/context/auth-context";
import { useTravelCreditUi } from "@/context/travel-credit-ui-context";
import { useCurrency } from "@/context/currency-context";
import { formatPriceFromMwk, resolvePaymentCurrency } from "@/lib/currencies";
import { paymentsApi, type PaymentConfig, type PaymentLedger, type MomoOperator, type ManualPaymentSource } from "@/lib/api";

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
  const [payMode, setPayMode] = useState<"paychangu" | "travel_credit" | "bank_transfer">("paychangu");

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
  const useGateway = config?.usePaymentGateway !== false;

  useEffect(() => {
    paymentsApi
      .getConfig()
      .then(setConfig)
      .catch(() =>
        setConfig({ checkoutMode: "direct", mockMode: true, usePaymentGateway: true, manualSources: [] }),
      );
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
    if (!useGateway && !canPayWithCredit) {
      setPayMode("bank_transfer");
    } else if (canPayWithCredit) {
      setPayMode("travel_credit");
    }
  }, [canPayWithCredit, useGateway]);

  const payModeToggle =
    travelCreditMwk > 0 || !useGateway ? (
      <div className="flex gap-2 rounded-xl border border-hairline bg-surface p-1">
        {travelCreditMwk > 0 && (
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
        )}
        {useGateway ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setPayMode("bank_transfer")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
              payMode === "bank_transfer" ? "nav-active font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Bank transfer
          </button>
        )}
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
        <p className="text-sm font-semibold text-signal">Payment confirmed - thank you!</p>
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

  if (payment?.status === "pending" && payment.paymentMethod === "manual_transfer") {
    return (
      <ManualBankTransferView
        payment={payment}
        amountMwk={amountMwk}
        formatDisplay={formatDisplay}
        loading={loading}
        error={error}
        onRefresh={async () => {
          const { payment: p } = await paymentsApi.get(payment.id);
          setPayment(p);
          if (p.status === "completed") onPaid();
        }}
        onSubmitProof={async (file) => {
          setLoading(true);
          setError(null);
          try {
            const base64 = await fileToBase64(file);
            const result = await paymentsApi.submitManualProof(payment.id, {
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              fileBase64: base64,
            });
            setPayment(result.payment);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload proof");
          } finally {
            setLoading(false);
          }
        }}
        onCancel={onCancel}
      />
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

  if (!useGateway && payMode === "bank_transfer" && !payment) {
    return (
      <ManualBankTransferStart
        applicationId={applicationId}
        amountMwk={amountMwk}
        formatDisplay={formatDisplay}
        manualSources={config?.manualSources ?? []}
        payModeToggle={payModeToggle}
        loading={loading}
        error={error}
        onStart={async () => {
          setLoading(true);
          setError(null);
          try {
            const result = await paymentsApi.initiateManual({
              applicationId,
              displayCurrency: effectiveCurrency,
            });
            setPayment(result.payment);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not start bank transfer");
          } finally {
            setLoading(false);
          }
        }}
        onCancel={onCancel}
      />
    );
  }

  if (isHosted && useGateway) {
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

      {payMode === "paychangu" && useGateway && (
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
          We will generate unique bank transfer details. You have 10 minutes to complete the transfer - we confirm automatically.
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
            : payment.paymentMethod === "manual_transfer"
              ? "Bank transfer"
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
          <Row label="Bank" value={payment.bankDetails.bankName ?? "-"} />
          <Row label="Account number" value={payment.bankDetails.accountNumber ?? "-"} mono />
          <Row label="Account name" value={payment.bankDetails.accountName ?? "-"} />
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

function ManualBankTransferStart({
  applicationId: _applicationId,
  amountMwk,
  formatDisplay,
  manualSources,
  payModeToggle,
  loading,
  error,
  onStart,
  onCancel,
}: {
  applicationId: string;
  amountMwk: number;
  formatDisplay: (mwk: number) => string;
  manualSources: ManualPaymentSource[];
  payModeToggle: React.ReactNode;
  loading: boolean;
  error: string | null;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="relative space-y-5">
      {loading && <LoadingOverlay label="Preparing payment" />}
      <AmountDue amountMwk={amountMwk} formatDisplay={formatDisplay} showPaymentNote={false} paymentCurrency="MWK" displayCurrency="MWK" />
      {payModeToggle}
      <p className="text-sm text-muted-foreground">
        Pay the exact quote amount by bank transfer to one of our accounts. You will receive a short reference to use in your transfer description.
      </p>
      {!manualSources.length && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bank account details are not available yet. Please contact support.
        </p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={loading || !manualSources.length}
          className="btn-signal flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Preparing…" : "Show bank details"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-hairline px-4 py-3 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ManualBankTransferView({
  payment,
  amountMwk,
  formatDisplay,
  loading,
  error,
  onRefresh,
  onSubmitProof,
  onCancel,
}: {
  payment: PaymentLedger;
  amountMwk: number;
  formatDisplay: (mwk: number) => string;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onSubmitProof: (file: File) => Promise<void>;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const sources = (payment.manualPaymentSources ?? []) as ManualPaymentSource[];
  const reviewStatus = payment.proofReviewStatus ?? "none";

  useEffect(() => {
    if (reviewStatus === "submitted") {
      const timer = setInterval(() => {
        void onRefresh();
      }, 8000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [reviewStatus, onRefresh]);

  if (reviewStatus === "submitted") {
    return (
      <div className="space-y-4 rounded-xl border border-signal/30 bg-signal-soft/20 p-5">
        <div className="flex items-center gap-2 text-signal">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-semibold">Proof submitted - awaiting review</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Our team is verifying your payment. You will be notified once it is confirmed.
        </p>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-signal underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      {loading && <LoadingOverlay label="Uploading proof" />}
      <AmountDue amountMwk={amountMwk} formatDisplay={formatDisplay} showPaymentNote={false} paymentCurrency="MWK" displayCurrency="MWK" />

      <div className="rounded-xl border border-signal/30 bg-signal-soft/20 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Transfer reference</p>
        <p className="mt-1 font-mono text-xl font-semibold">{payment.manualReference ?? "-"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Use this exactly as the payment description or reference when you transfer.
        </p>
      </div>

      {reviewStatus === "rejected" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Your previous proof was rejected
          {payment.proofRejectionReason ? `: ${payment.proofRejectionReason}` : "."} Please upload a clearer receipt.
        </p>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold">Pay to one of these accounts</p>
        {sources.map((source) => (
          <dl key={source.id} className="space-y-2 rounded-xl border border-hairline bg-background p-4 text-sm">
            <p className="font-medium">{source.label}</p>
            <Row label="Bank" value={source.bankName} />
            <Row label="Account name" value={source.accountName} />
            <Row label="Account number" value={source.accountNumber} mono />
            {source.branchCode && <Row label="Branch" value={source.branchCode} />}
            {source.swiftCode && <Row label="SWIFT" value={source.swiftCode} mono />}
            <Row label="Currency" value={source.currency} />
            {source.instructions && (
              <p className="text-xs text-muted-foreground">{source.instructions}</p>
            )}
          </dl>
        ))}
      </div>

      {!showUpload ? (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="btn-signal flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
        >
          <CheckCircle2 className="h-4 w-4" />
          I&apos;ve paid
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-hairline p-4">
          <p className="text-sm font-medium">Upload proof of payment</p>
          <p className="text-xs text-muted-foreground">PDF or image (JPEG, PNG, WebP), max 8MB.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onSubmitProof(file);
            }}
          />
          <button type="button" onClick={() => setShowUpload(false)} className="text-xs text-muted-foreground underline">
            Cancel upload
          </button>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <button type="button" onClick={onCancel} className="w-full rounded-xl border border-hairline px-4 py-3 text-sm">
        Close
      </button>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
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
