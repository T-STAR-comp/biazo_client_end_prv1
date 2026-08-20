import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { FlightApplicationForm } from "@/components/flight-application-form";
import { HowItWorksBanner } from "@/components/how-it-works-banner";

export const Route = createFileRoute("/dashboard/book")({
  component: ApplyFlightPage,
});

function ApplyFlightPage() {
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (submittedRef) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Request sent</h1>
        <p className="text-base text-muted-foreground">
          Reference <strong className="font-mono text-ink">{submittedRef}</strong>. We've emailed you and our team is finding your best price.
        </p>
        <div className="rounded-2xl border border-hairline bg-signal-soft p-5 text-left text-sm">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            <p>Most quotes arrive within a few hours. You can track progress anytime under Applications.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/dashboard/applications" className="btn-signal rounded-full px-6 py-3 text-sm font-semibold">
            View my requests
          </Link>
          <button type="button" onClick={() => setSubmittedRef(null)} className="rounded-full border border-hairline px-6 py-3 text-sm font-medium">
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Step 1 of 3</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">Request a flight quote</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Tell us your trip details. We check airlines and email you a price to approve — no payment yet.
        </p>
      </div>
      <HowItWorksBanner compact />
      <FlightApplicationForm onSubmitted={setSubmittedRef} />
    </div>
  );
}
