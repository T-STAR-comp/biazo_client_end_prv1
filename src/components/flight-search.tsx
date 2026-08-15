import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ArrowLeftRight, CalendarIcon, MapPin, Plane, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";

type TripType = "roundtrip" | "oneway" | "multi";

type CountryOption = {
  value: string;
  label: string;
  from: string;
};

const tripLabels: Record<TripType, { full: string; short: string }> = {
  roundtrip: { full: "Round trip", short: "Round" },
  oneway: { full: "One way", short: "One way" },
  multi: { full: "Multi-city", short: "Multi" },
};

export function FlightSearch({
  variant = "hero",
  countryOptions = [],
  selectedCountry,
  onCountryChange,
  onSearch,
  stayOnPage = false,
}: {
  variant?: "hero" | "compact";
  countryOptions?: CountryOption[];
  selectedCountry?: CountryOption;
  onCountryChange?: (value: string) => void;
  onSearch?: (params: import("@/lib/api").FlightSearchParams) => void | Promise<void>;
  stayOnPage?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const { effectiveCurrency } = useCurrency();
  const searchTo = isAuthenticated ? "/dashboard/book" : "/book";
  const [trip, setTrip] = useState<TripType>("roundtrip");
  const [from, setFrom] = useState(selectedCountry?.from ?? "Lilongwe (LLW)");
  const [to, setTo] = useState("Johannesburg (JNB)");
  const [departDate, setDepartDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 16));
  const [departOpen, setDepartOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  useEffect(() => {
    if (selectedCountry?.from) {
      setFrom(selectedCountry.from);
    }
  }, [selectedCountry]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleDepartSelect = (date: Date | undefined) => {
    if (!date) return;
    setDepartDate(date);
    if (returnDate <= date) {
      setReturnDate(addDays(date, 1));
    }
    setDepartOpen(false);
  };

  const handleReturnSelect = (date: Date | undefined) => {
    if (!date) return;
    setReturnDate(date);
    setReturnOpen(false);
  };

  const countryValue = selectedCountry?.value ?? countryOptions[0]?.value ?? "";

  const applyButton = stayOnPage ? (
    <button
      type="button"
      onClick={() =>
        onSearch?.({
          origin: from,
          destination: to,
          date: format(departDate, "yyyy-MM-dd"),
        })
      }
      className="btn-signal col-span-full flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold lg:col-span-1"
    >
      <Plane className="h-4 w-4" />
      <span>Apply for a flight</span>
    </button>
  ) : (
    <Link
      to={searchTo}
      onClick={() =>
        onSearch?.({
          origin: from,
          destination: to,
          date: format(departDate, "yyyy-MM-dd"),
        })
      }
      className="btn-signal col-span-full flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold lg:col-span-1"
    >
      <Plane className="h-4 w-4" />
      <span>Apply for a flight</span>
    </Link>
  );

  return (
    <div className="glass-panel rounded-2xl p-2 sm:rounded-3xl">
      <div className="flex flex-col gap-1 rounded-2xl bg-secondary/60 p-1 text-xs font-medium sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1">
          {(["roundtrip", "oneway", "multi"] as const).map((key) => {
            const inactive = key === "multi";
            return (
              <button
                key={key}
                type="button"
                disabled={inactive}
                onClick={() => !inactive && setTrip(key)}
                className={`min-h-[44px] rounded-xl px-3 py-2 transition-colors sm:px-4 ${
                  inactive
                    ? "btn-inert"
                    : trip === key
                      ? "bg-background text-ink shadow-sm"
                      : "text-muted-foreground hover:text-ink"
                }`}
              >
                <span className="sm:hidden">{tripLabels[key].short}</span>
                <span className="hidden sm:inline">{tripLabels[key].full}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground sm:ml-auto sm:pr-2">
          <span className="btn-inert min-h-[44px] flex-1 rounded-xl px-3 py-2 sm:flex-none">Economy</span>
          <span className="hidden h-4 w-px bg-hairline sm:block" />
          <span className="btn-inert min-h-[44px] flex-1 rounded-xl px-3 py-2 sm:flex-none">1 pax</span>
        </div>
      </div>

      <div className="mt-2 grid gap-2 rounded-2xl bg-background p-2 lg:grid-cols-[1fr_1fr_auto_1fr_auto]">
        {countryOptions.length > 0 && (
          <Field icon={<MapPin className="h-4 w-4" />} label="Country" className="lg:col-span-1">
            <Select value={countryValue} onValueChange={(value) => onCountryChange?.(value)}>
              <SelectTrigger className="h-auto min-h-[44px] border-0 bg-transparent p-0 text-base font-semibold text-ink shadow-none focus:ring-0">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Any country worldwide</span>
          </Field>
        )}

        <div className="relative grid gap-2 sm:grid-cols-2 lg:contents">
          <Field icon={<MapPin className="h-4 w-4" />} label="From">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full min-h-[44px] bg-transparent text-base font-semibold text-ink outline-none"
            />
            <span className="text-xs text-muted-foreground">
              {selectedCountry?.from ?? "Departure airport"}
            </span>
          </Field>

          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="touch-target absolute right-1/2 top-[calc(50%-4px)] z-10 flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-hairline bg-background p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-ink sm:top-1/2 lg:hidden"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <Field icon={<MapPin className="h-4 w-4" />} label="To">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full min-h-[44px] bg-transparent text-base font-semibold text-ink outline-none"
            />
            <span className="text-xs text-muted-foreground">Any destination worldwide</span>
          </Field>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap origin and destination"
          className="hidden min-h-[44px] items-center justify-center rounded-xl border border-hairline bg-surface px-3 text-muted-foreground transition-colors hover:bg-background hover:text-ink lg:flex"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-2 gap-2 lg:contents">
          <Field icon={<CalendarIcon className="h-4 w-4" />} label="Depart">
            <DateButton
              date={departDate}
              open={departOpen}
              onOpenChange={setDepartOpen}
              onSelect={handleDepartSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </Field>

          {trip !== "oneway" ? (
            <Field icon={<CalendarIcon className="h-4 w-4" />} label="Return">
              <DateButton
                date={returnDate}
                open={returnOpen}
                onOpenChange={setReturnOpen}
                onSelect={handleReturnSelect}
                disabled={(date) => date <= departDate}
              />
            </Field>
          ) : (
            <Field icon={<CalendarIcon className="h-4 w-4" />} label="Return">
              <span className="text-base font-semibold text-muted-foreground">—</span>
              <span className="text-xs text-muted-foreground">One way</span>
            </Field>
          )}
        </div>

        {applyButton}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-3 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span className="btn-inert inline-block">Direct only</span>
        <span className="hidden h-3 w-px bg-hairline sm:block" />
        <span className="btn-inert hidden sm:inline">Include nearby airports</span>
        <span className="hidden h-3 w-px bg-hairline sm:block" />
        <span className="btn-inert hidden sm:inline">Flexible dates (±3 days)</span>
      </div>
      <div className="px-3 pb-3 text-[11px] text-muted-foreground sm:text-xs">
        Prices shown in {effectiveCurrency} at bank rate.
      </div>
    </div>
  );
}

function DateButton({
  date,
  open,
  onOpenChange,
  onSelect,
  disabled,
}: {
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (date: Date | undefined) => void;
  disabled: (date: Date) => boolean;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="min-h-[44px] w-full text-left">
          <span className="block text-sm font-semibold text-ink sm:text-base">
            {format(date, "EEE, dd MMM")}
          </span>
          <span className="text-xs text-muted-foreground">{format(date, "yyyy")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromYear={new Date().getFullYear()}
          toYear={new Date().getFullYear() + 2}
          selected={date}
          onSelect={onSelect}
          disabled={disabled}
          className="[--cell-size:2.75rem] sm:[--cell-size:2.5rem]"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function Field({
  icon,
  label,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`group flex flex-col gap-1 rounded-xl border border-transparent bg-surface px-3 py-2.5 transition-colors focus-within:border-signal hover:border-hairline sm:px-4 sm:py-3 ${className}`}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex min-w-0 flex-col leading-tight">{children}</div>
    </label>
  );
}
