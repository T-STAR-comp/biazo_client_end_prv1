import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Cookie, Database, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Privacy & Legal — Biazo" },
      { name: "description", content: "How Biazo handles your data, and the legal notes behind it." },
    ],
  }),
  component: Legal,
});

const cards = [
  {
    icon: Database,
    h: "What we collect",
    p: "Just what's needed to book a flight and keep you flying safely — name as per passport, date of birth, contact details, and payment information. We do not sell or trade your data.",
  },
  {
    icon: Lock,
    h: "How it's stored",
    p: "All personal data is encrypted at rest (AES-256) and in transit (TLS 1.3). Payment details are handled by PCI-DSS Level 1 processors and never touch Biazo servers directly.",
  },
  {
    icon: Cookie,
    h: "Cookies & tracking",
    p: "Essential cookies keep you signed in and your basket intact. Analytics cookies are opt-in — you'll be asked once, and can change your mind from Settings at any time.",
  },
  {
    icon: Mail,
    h: "Your rights",
    p: "Under GDPR and POPIA you can request a copy of your data, correct it, or ask us to delete it. Write to privacy@biazo.travel and we'll respond within 14 days.",
  },
];

function Legal() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          Legal · Privacy & data
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.03em] md:text-6xl">
          Your data, plainly explained.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          We collect the minimum we need to book flights on your behalf, and we
          treat that data like it belongs to us too — because in a way, it does.
        </p>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {cards.map(({ icon: Icon, h, p }) => (
            <div
              key={h}
              className="rounded-2xl border border-hairline bg-surface-elevated p-8"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-signal-soft text-signal">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-ink">
                {h}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 space-y-12">
          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Data controller</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Biazo Traveling Agency (Pty) Ltd, registered at 12 Bree Street, Cape
              Town 8001, South Africa. Registration number 2019/482910/07. Our
              Information Officer can be reached at privacy@biazo.travel.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Who we share with</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Only the airlines, hotels, and transport providers you book with;
              our payment processor; and cloud infrastructure providers under
              strict data-processing agreements. We never share your data with
              advertisers.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Retention</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Booking records are retained for seven years to satisfy tax and
              aviation law. All other personal data is deleted within 90 days of
              account closure unless legally required otherwise.
            </p>
          </section>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-6 text-sm">
          <span className="text-muted-foreground">
            Looking for the fine print instead?
          </span>
          <Link
            to="/terms"
            className="font-semibold text-ink hover:text-signal"
          >
            Read the Terms of Service →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
