import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FlightSearch } from "@/components/flight-search";

type CountryOption = {
  value: string;
  label: string;
  from: string;
};

export function HeroFlightPanel({
  countryOptions,
  selectedCountry,
  onCountryChange,
}: {
  countryOptions: CountryOption[];
  selectedCountry: CountryOption;
  onCountryChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-8 hidden w-full sm:block">
        <FlightSearch
          countryOptions={countryOptions}
          selectedCountry={selectedCountry}
          onCountryChange={onCountryChange}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 sm:hidden">
        {!open ? (
          <div className="border-t border-white/15 bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-signal flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold"
            >
              Apply for a flight
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="max-h-[min(85dvh,720px)] overflow-y-auto rounded-t-3xl border-t border-hairline bg-background/95 shadow-none backdrop-blur-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-background/95 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Apply for a flight</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="touch-target inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Collapse flight form"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <FlightSearch
                variant="compact"
                countryOptions={countryOptions}
                selectedCountry={selectedCountry}
                onCountryChange={onCountryChange}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
