import { useCurrency } from "@/context/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelector({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "overlay";
  className?: string;
}) {
  const { siteCurrency, setSiteCurrency, currencies, effectiveCurrency, effectiveSource } =
    useCurrency();

  return (
    <Select value={siteCurrency} onValueChange={setSiteCurrency}>
      <SelectTrigger
        aria-label="Display currency"
        className={
          variant === "overlay"
            ? `h-9 min-h-[36px] w-full border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/15 sm:w-24 ${className}`
            : `h-9 min-h-[36px] w-[5.5rem] border-hairline bg-surface text-xs font-semibold sm:w-24 ${className}`
        }
      >
        <SelectValue placeholder={effectiveCurrency} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="font-semibold">{currency.code}</span>
            <span className="ml-2 text-muted-foreground">{currency.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
      {effectiveSource === "account" && (
        <span className="sr-only">Account currency override active: {effectiveCurrency}</span>
      )}
    </Select>
  );
}

export function FormattedPrice({ amountMwk }: { amountMwk: number }) {
  const { formatPrice } = useCurrency();
  return <>{formatPrice(amountMwk)}</>;
}
