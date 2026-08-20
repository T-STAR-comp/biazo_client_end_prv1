import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Compass, Leaf, Shield, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroFlightPanel } from "@/components/hero-flight-panel";
import { HowItWorksBanner } from "@/components/how-it-works-banner";
import { WhatsAppHelp } from "@/components/whatsapp-help";
import { destinationImages, HERO_IMAGE } from "@/lib/destination-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biazo - Explore Beyond the Boundaries" },
      {
        name: "description",
        content:
          "Book flights and design journeys with Biazo Traveling Agency. Calm, efficient, human travel.",
      },
    ],
  }),
  component: Landing,
});

const countryOptions = [
  { value: "malawi", label: "Malawi", from: "Lilongwe (LLW)" },
  { value: "south-africa", label: "South Africa", from: "Johannesburg (JNB)" },
  { value: "united-states", label: "United States", from: "New York (JFK)" },
  { value: "united-kingdom", label: "United Kingdom", from: "London (LHR)" },
  { value: "canada", label: "Canada", from: "Toronto (YYZ)" },
  { value: "australia", label: "Australia", from: "Sydney (SYD)" },
  { value: "germany", label: "Germany", from: "Frankfurt (FRA)" },
  { value: "france", label: "France", from: "Paris (CDG)" },
  { value: "italy", label: "Italy", from: "Rome (FCO)" },
  { value: "spain", label: "Spain", from: "Madrid (MAD)" },
  { value: "netherlands", label: "Netherlands", from: "Amsterdam (AMS)" },
  { value: "japan", label: "Japan", from: "Tokyo (NRT)" },
  { value: "china", label: "China", from: "Beijing (PEK)" },
  { value: "india", label: "India", from: "Mumbai (BOM)" },
  { value: "brazil", label: "Brazil", from: "São Paulo (GRU)" },
  { value: "mexico", label: "Mexico", from: "Mexico City (MEX)" },
  { value: "uae", label: "United Arab Emirates", from: "Dubai (DXB)" },
  { value: "saudi-arabia", label: "Saudi Arabia", from: "Riyadh (RUH)" },
  { value: "qatar", label: "Qatar", from: "Doha (DOH)" },
  { value: "kenya", label: "Kenya", from: "Nairobi (NBO)" },
  { value: "nigeria", label: "Nigeria", from: "Lagos (LOS)" },
  { value: "egypt", label: "Egypt", from: "Cairo (CAI)" },
  { value: "morocco", label: "Morocco", from: "Casablanca (CMN)" },
  { value: "portugal", label: "Portugal", from: "Lisbon (LIS)" },
  { value: "turkey", label: "Turkey", from: "Istanbul (IST)" },
  { value: "singapore", label: "Singapore", from: "Singapore (SIN)" },
  { value: "thailand", label: "Thailand", from: "Bangkok (BKK)" },
  { value: "south-korea", label: "South Korea", from: "Seoul (ICN)" },
  { value: "new-zealand", label: "New Zealand", from: "Auckland (AKL)" },
  { value: "switzerland", label: "Switzerland", from: "Zurich (ZRH)" },
  { value: "sweden", label: "Sweden", from: "Stockholm (ARN)" },
  { value: "norway", label: "Norway", from: "Oslo (OSL)" },
  { value: "zambia", label: "Zambia", from: "Lusaka (LUN)" },
  { value: "botswana", label: "Botswana", from: "Gaborone (GBE)" },
  { value: "tanzania", label: "Tanzania", from: "Dar es Salaam (DAR)" },
  { value: "uganda", label: "Uganda", from: "Entebbe (EBB)" },
  { value: "ghana", label: "Ghana", from: "Accra (ACC)" },
  { value: "mozambique", label: "Mozambique", from: "Maputo (MPM)" },
];

const destinationsBase = [
  { city: "Cape Town", country: "South Africa" },
  { city: "Nairobi", country: "Kenya" },
  { city: "Marrakech", country: "Morocco" },
  { city: "Zanzibar", country: "Tanzania" },
  { city: "Lagos", country: "Nigeria" },
  { city: "Kigali", country: "Rwanda" },
  { city: "Cairo", country: "Egypt" },
  { city: "Accra", country: "Ghana" },
  { city: "Lilongwe", country: "Malawi" },
  { city: "Windhoek", country: "Namibia" },
  { city: "Addis Ababa", country: "Ethiopia" },
  { city: "Dakar", country: "Senegal" },
].map(({ city, country }) => {
  const image = destinationImages[city as keyof typeof destinationImages];
  return { city, country, img: image.src, alt: image.alt };
});

const principles = [
  {
    icon: Compass,
    title: "Human-scale planning",
    body: "Every itinerary is reviewed by a travel designer before you confirm. No bots. No filler.",
  },
  {
    icon: Shield,
    title: "Fair, transparent pricing",
    body: "The price you see is the price you pay. Baggage, seat, taxes - surfaced upfront, always.",
  },
  {
    icon: Leaf,
    title: "Lighter footprint",
    body: "Direct routes are prioritised. Every booking offsets its share of carbon automatically.",
  },
  {
    icon: Sparkles,
    title: "Concierge you can text",
    body: "One thread, one team. Real people on WhatsApp from booking through landing.",
  },
];

function Landing() {
  const [selectedCountryValue, setSelectedCountryValue] = useState(countryOptions[0].value);
  const selectedCountry = useMemo(
    () => countryOptions.find((country) => country.value === selectedCountryValue) ?? countryOptions[0],
    [selectedCountryValue],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HERO - image fills from top, header overlays */}
      <section className="relative overflow-hidden">
        <div className="relative w-full">
          <div className="relative min-h-[100dvh] overflow-hidden bg-ink sm:min-h-[85vh] lg:min-h-[92vh]">
            <img
              src={HERO_IMAGE}
              alt="View from an airplane window over clouds at sunrise"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/25 to-black/80" />

            <SiteHeader overlay />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 pt-20 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:min-h-[85vh] sm:px-6 sm:pt-24 sm:pb-8 lg:min-h-[92vh] lg:px-8">
              <div className="flex flex-1 flex-col justify-center sm:block sm:flex-none sm:max-w-2xl sm:pt-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-signal sm:hidden">
                  Biazo Traveling Agency
                </p>
                <h1 className="text-[2.85rem] leading-[1.02] font-semibold tracking-[-0.045em] text-white sm:text-4xl sm:leading-[0.95] md:text-5xl lg:text-6xl">
                  Explore beyond
                  <br />
                  the <span className="text-display text-signal">boundaries.</span>
                </h1>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:mt-4 sm:text-base">
                  Tell us where you want to go. We find the best price and email you a quote — no payment until you say yes.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 sm:hidden">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm">
                    Any country worldwide
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm">
                    From Lilongwe, Malawi
                  </span>
                </div>
                <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55 sm:hidden">
                  Tap below to request a quote
                </p>
              </div>

              <HeroFlightPanel
                countryOptions={countryOptions}
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountryValue}
              />
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto border-y border-hairline py-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:overflow-visible sm:text-xs">
              <span className="shrink-0 snap-start font-semibold text-foreground sm:text-muted-foreground">Trusted partners</span>
              <span className="shrink-0 snap-start whitespace-nowrap">South African Airways</span>
              <span className="shrink-0 snap-start whitespace-nowrap">TAP Air Portugal</span>
              <span className="shrink-0 snap-start whitespace-nowrap">Qatar Airways</span>
              <span className="shrink-0 snap-start whitespace-nowrap">Emirates</span>
              <span className="shrink-0 snap-start whitespace-nowrap">Kenya Airways</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <HowItWorksBanner />
      </section>

      {/* WHO IS BIAZO */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-32">
        <div className="grid gap-10 sm:gap-16 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-signal sm:mb-6">
              Who is Biazo
            </p>
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl md:text-6xl">
              A travel house built around
              <span className="text-display"> people, </span>
              not itineraries.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>
              Biazo started in 2019 with a small studio in Lilongwe and one stubborn
              belief - that booking a flight should feel like the start of the trip,
              not a chore that survives it. Seven years later, our team of designers,
              engineers and lifelong travellers still answer every thread ourselves.
            </p>
            <p>
              We don't sell packages. We build routes around the way you actually
              travel - quiet mornings, long layovers with intent, the one restaurant
              worth a detour. Every booking on Biazo is checked by a human before it
              goes to the airline, and every traveller gets a single concierge from
              search to landing.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="btn-signal inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline sm:mt-20 md:grid-cols-4">
          {[
            ["Global", "Any country"],
            ["Malawi", "Built in Lilongwe"],
            ["Human", "Concierge support"],
            ["Simple", "Apply online"],
          ].map(([n, l]) => (
            <div key={l} className="bg-background p-4 sm:p-8">
              <div className="text-2xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">{n}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="border-y border-hairline bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-16">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                What we stand for
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">
                Four rules we won't break.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              These are the things every traveller can count on - no matter where
              they're headed, no matter how they booked.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4 bg-background p-5 sm:gap-6 sm:p-8">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-signal-soft text-signal">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="mx-auto w-full max-w-none px-0 py-16 sm:py-24 md:py-32">
        <div className="mx-auto mb-8 flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:mb-12 sm:gap-6 sm:px-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-signal sm:mb-4">
              In season
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">
              Places worth the ticket, right now.
            </h2>
          </div>
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-signal"
          >
            All destinations <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-0 md:grid-cols-3">
          {destinationsBase.map((d, i) => (
            <Link
              key={d.city}
              to="/book"
              className={`group relative overflow-hidden bg-ink ${
                i === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <img
                src={d.img}
                alt={d.alt}
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                  i === 0 ? "h-56 sm:h-[420px] md:h-[520px]" : "h-48 sm:h-64 md:h-72"
                }`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/70 sm:text-xs">
                  {d.country}
                </div>
                <div className={`font-semibold tracking-tight ${i === 0 ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                  {d.city}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-32">
        <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-ivory sm:rounded-3xl sm:p-10 md:p-16">
          <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                Ready when you are
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-6xl">
                Your next trip is already
                <br />
                <span className="text-display">closer than it looks.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="btn-signal inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Join Biazo
              </Link>
              <Link
                to="/book"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Apply for a flight <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppHelp />
    </div>
  );
}
