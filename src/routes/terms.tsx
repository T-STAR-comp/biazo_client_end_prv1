import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service - Biazo" },
      { name: "description", content: "The terms that govern your use of Biazo Traveling Agency." },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    h: "1. Agreement",
    p: `These Terms of Service ("Terms") form a binding agreement between you and Biazo Traveling Agency (Pty) Ltd ("Biazo", "we", "us"). By creating a Biazo account, booking a flight, or otherwise using our services, you agree to these Terms in full. If you do not agree, please do not use the service.`,
  },
  {
    h: "2. Bookings and payment",
    p: `Every booking made through Biazo is subject to availability and confirmation by the operating carrier. Prices are quoted in the currency shown at checkout and include taxes, fees, and Biazo's service fee unless clearly noted. Payment is taken in full at the time of booking and settled with the airline within 24 hours. In the rare case a fare is withdrawn between search and payment, we will contact you before charging.`,
  },
  {
    h: "3. Changes and cancellations",
    p: `Most fares are governed by airline rules that Biazo cannot override. Where a change is possible, we will surface the fee and process it on your behalf without additional charge. Voluntary cancellations follow the fare's cancellation policy. Involuntary changes (schedule shifts, cancellations initiated by the airline) are managed by your Biazo concierge at no charge and you are entitled to a full refund where the airline is unable to accommodate you.`,
  },
  {
    h: "4. Traveller responsibilities",
    p: `You are responsible for providing accurate passenger information at time of booking, holding valid travel documents (passport, visa, health documentation) for your journey, arriving at the airport at the airline's recommended time, and complying with the rules of the airlines and countries you travel through. Biazo is not liable for denied boarding resulting from missing or invalid documentation.`,
  },
  {
    h: "5. Concierge scope",
    p: `Every booking includes access to a Biazo concierge from booking through arrival at your final destination. The concierge assists with schedule changes, rebooking, seat requests, baggage claims, and irregular operations. Concierge service does not extend to onward ground arrangements unless separately booked through Biazo.`,
  },
  {
    h: "6. Liability",
    p: `Biazo acts as an agent for the airlines and travel providers we book. Our liability for any single booking is limited to the total amount paid for that booking. We are not liable for indirect or consequential losses, including missed connections on tickets not issued by Biazo, hotel bookings made independently, or personal loss during travel.`,
  },
  {
    h: "7. Account termination",
    p: `You may close your Biazo account at any time from Settings. We may suspend or terminate accounts that are used fraudulently, that abuse our concierge team, or that violate the rules of our airline partners. In such cases pending bookings will be honoured but no new bookings may be made.`,
  },
  {
    h: "8. Changes to these Terms",
    p: `We update these Terms from time to time. Material changes will be sent by email at least 14 days before they take effect. Continued use of Biazo after the effective date constitutes acceptance of the updated Terms.`,
  },
  {
    h: "9. Contact",
    p: `Questions about these Terms can be sent to hello@biazo.net or to Biazo Traveling Agency, Lilongwe, Malawi. Phone: +265 995 43 54 70.`,
  },
];

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          Legal · Terms of Service
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.03em] md:text-6xl">
          The rules of the road.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Effective 1 January 2026 · Version 3.2
        </p>

        <div className="mt-16 space-y-12">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                {s.h}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {s.p}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted-foreground">
          Prefer plain-English summaries?{" "}
          <Link to="/legal" className="font-medium text-ink hover:text-signal">
            Read our privacy & data notes →
          </Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
