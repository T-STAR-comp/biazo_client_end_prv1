import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Biazo Traveling Agency" },
      { name: "description", content: "About Biazo Traveling Agency." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          About Biazo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl lg:text-7xl">
          A quieter kind of travel <span className="text-display">company.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          We're twenty-four people working out of Lilongwe, Blantyre and Nairobi,
          building the travel agency we wished existed when we started flying for
          a living.
        </p>

        <img
          src="/images/about-travel.jpg"
          alt="Nairobi skyline on a sunny day, Kenya"
          className="mt-10 h-48 w-full rounded-2xl object-cover sm:mt-16 sm:h-[52vh] sm:rounded-3xl"
        />

        <div className="mt-16 rounded-2xl border border-hairline bg-surface p-6 text-center sm:mt-24 sm:rounded-3xl sm:p-10 md:p-16">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl md:text-4xl">
            Come fly with us.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Sixty seconds to make an account. Zero pressure after that.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="btn-signal mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            Join Biazo
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
