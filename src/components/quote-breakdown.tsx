import { Building2, Car, Plane, Sparkles, X } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { formatPriceFromMwk, resolvePaymentCurrency } from "@/lib/currencies";
import type { QuoteLineItem } from "@/lib/api";

type Props = {
  items: QuoteLineItem[];
  totalMwk: number;
  exchangeRates?: Record<string, number>;
  onRemove?: (itemId: string) => void;
  removingId?: string | null;
};

const TYPE_ICONS = {
  fare: Plane,
  hotel: Building2,
  car_rental: Car,
  extra: Sparkles,
} as const;

function detailLines(item: QuoteLineItem): string[] {
  const lines: string[] = [];
  if (item.description) lines.push(item.description);
  if (item.details) {
    if (item.type === "hotel") {
      if (item.details.hotelName) lines.push(`Hotel: ${item.details.hotelName}`);
      if (item.details.roomType) lines.push(`Room: ${item.details.roomType}`);
      if (item.details.nights) lines.push(`${item.details.nights} night(s)`);
    }
    if (item.type === "car_rental") {
      if (item.details.provider) lines.push(`Rental company: ${item.details.provider}`);
      if (item.details.vehicle) lines.push(`Vehicle: ${item.details.vehicle}`);
      if (item.details.days) lines.push(`${item.details.days} day(s)`);
    }
  }
  return [...new Set(lines)];
}

export function QuoteBreakdown({ items, totalMwk, exchangeRates, onRemove, removingId }: Props) {
  const { effectiveCurrency } = useCurrency();
  const formatAmount = (amountMwk: number) =>
    formatPriceFromMwk(amountMwk, effectiveCurrency, exchangeRates);
  const paymentCurrency = resolvePaymentCurrency(effectiveCurrency);
  const showPaymentNote = effectiveCurrency !== paymentCurrency;

  const active = items.filter((i) => !i.removed);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quote breakdown</p>
      <ul className="space-y-2">
        {active.map((item) => {
          const Icon = TYPE_ICONS[item.type] ?? Sparkles;
          const details = detailLines(item);
          return (
            <li
              key={item.id}
              className="rounded-xl border border-hairline bg-background px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-soft text-signal">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    {details.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {details.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {item.removable && onRemove && (
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Optional — remove if not needed
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatAmount(item.amountMwk)}
                  </span>
                  {item.removable && onRemove && (
                    <button
                      type="button"
                      title={`Remove ${item.label}`}
                      disabled={removingId === item.id}
                      onClick={() => onRemove(item.id)}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-hairline pt-3">
        <span className="text-sm font-semibold">Total due</span>
        <span className="text-2xl font-semibold tabular-nums">{formatAmount(totalMwk)}</span>
      </div>
      {showPaymentNote && (
        <p className="text-xs text-muted-foreground">
          Prices shown in {effectiveCurrency}. Payment will be processed in {paymentCurrency} via PayChangu.
        </p>
      )}
    </div>
  );
}
