import { Plane, Search, Ticket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Tell us where you want to go",
    body: "Pick your route and travel dates. No payment needed yet.",
  },
  {
    icon: Plane,
    title: "We find the best price",
    body: "Our team checks partner airlines and sends you a clear quote by email.",
  },
  {
    icon: Ticket,
    title: "You pay and get your tickets",
    body: "Review your quote, pay securely, and receive e-tickets in your dashboard.",
  },
];

export function HowItWorksBanner({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`rounded-2xl border border-hairline bg-surface ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}
      aria-label="How booking works"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">How it works</p>
      <h2 className={`mt-2 font-semibold tracking-[-0.02em] text-ink ${compact ? "text-lg" : "text-xl"}`}>
        Three simple steps
      </h2>
      <ol className={`mt-4 grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
        {steps.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex gap-3 rounded-xl bg-background p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal-soft text-signal">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Step {index + 1}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
