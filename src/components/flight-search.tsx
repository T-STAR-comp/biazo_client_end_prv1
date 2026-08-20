import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ArrowLeftRight, CalendarIcon, MapPin, Plane } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";
import { FLIGHT_LOCATION_SUGGESTIONS } from "@/lib/flight-locations";

type TripType = "roundtrip" | "oneway";

type CountryOption = {
  value: string;
  label: string;
  from: string;
};

const tripLabels: Record<TripType, { full: string; short: string }> = {
  roundtrip: { full: "Return trip", short: "Return" },
  oneway: { full: "One way", short: "One way" },
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
  const [countryQuery, setCountryQuery] = useState(selectedCountry?.label ?? "");

  useEffect(() => {
    if (selectedCountry?.from) {
      setFrom(selectedCountry.from);
    }
    if (selectedCountry?.label) {
      setCountryQuery(selectedCountry.label);
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

  const handleCountryInput = (value: string) => {
    setCountryQuery(value);
    const match = countryOptions.find((country) => country.label.toLowerCase() === value.toLowerCase());
    if (match) {
      onCountryChange?.(match.value);
      setFrom(match.from);
    }
  };

  const applyButtonClass =
    "btn-signal inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto sm:min-w-[11rem] lg:min-h-[40px] lg:px-4 lg:py-2 lg:text-sm";

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
      className={applyButtonClass}
    >
      <Plane className="h-4 w-4" />
      <span>Request a quote</span>
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
      className={applyButtonClass}
    >
      <Plane className="h-4 w-4" />
      <span>Request a quote</span>
    </Link>
  );

  return (
    <div className="glass-panel rounded-2xl p-2 sm:rounded-3xl">
      <div className="flex flex-wrap gap-1 rounded-2xl bg-secondary/60 p-1 text-xs font-medium">
        {(["roundtrip", "oneway"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTrip(key)}
            className={`min-h-[44px] rounded-xl px-3 py-2 transition-colors sm:px-4 ${
              trip === key ? "bg-background text-ink shadow-sm" : "text-muted-foreground hover:text-ink"
            }`}
          >
            <span className="sm:hidden">{tripLabels[key].short}</span>
            <span className="hidden sm:inline">{tripLabels[key].full}</span>
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-2 rounded-2xl bg-background p-2 lg:grid-cols-[1fr_1fr_auto_1fr]">
        {countryOptions.length > 0 && (
          <Field icon={<MapPin className="h-4 w-4" />} label="Country" className="lg:col-span-1">
            <input
              list="flight-country-options"
              value={countryQuery}
              onChange={(e) => handleCountryInput(e.target.value)}
              placeholder="Type or pick a country"
              className="w-full min-h-[44px] bg-transparent text-base font-semibold text-ink outline-none"
            />
            <datalist id="flight-country-options">
              {countryOptions.map((country) => (
                <option key={country.value} value={country.label} />
              ))}
            </datalist>
            <span className="text-xs text-muted-foreground">Optional - quick-fill departure airport</span>
          </Field>
        )}

        <div className="relative grid gap-2 sm:grid-cols-2 lg:contents">
          <Field icon={<MapPin className="h-4 w-4" />} label="From">
            <input
              list="flight-from-options"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="City or airport"
              className="w-full min-h-[44px] bg-transparent text-base font-semibold text-ink outline-none"
            />
            <datalist id="flight-from-options">
              {FLIGHT_LOCATION_SUGGESTIONS.map((s) => (
                <option key={`from-${s.code}`} value={s.label} />
              ))}
            </datalist>
            <span className="text-xs text-muted-foreground">
              {selectedCountry?.from ?? "Departure city or airport"}
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
              list="flight-to-options"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="City or airport"
              className="w-full min-h-[44px] bg-transparent text-base font-semibold text-ink outline-none"
            />
            <datalist id="flight-to-options">
              {FLIGHT_LOCATION_SUGGESTIONS.map((s) => (
                <option key={`to-${s.code}`} value={s.label} />
              ))}
            </datalist>
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
              <span className="text-base font-semibold text-muted-foreground">-</span>
              <span className="text-xs text-muted-foreground">One way</span>
            </Field>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-stretch px-2 sm:justify-end">
        {applyButton}
      </div>

      <div className="px-3 pb-3 pt-2 text-xs text-muted-foreground sm:text-sm">
        Prices shown in {effectiveCurrency} at bank rate. No payment until you approve your quote.
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
