import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Biazo Traveling Agency" },
      { name: "description", content: "About Biazo Traveling Agency - visionaries in Lilongwe, Malawi." },
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
          Built by visionaries in <span className="text-display">Lilongwe.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          Biazo was created by visionaries in Malawi - rooted in Lilongwe, serving travellers
          who want a calmer way to fly. You can apply for flights to any country; our team
          reviews every request and handles ticketing with care.
        </p>

        <img
          src="/images/about-travel.jpg"
          alt="Travel scene"
          className="mt-10 h-48 w-full rounded-2xl object-cover sm:mt-16 sm:h-[52vh] sm:rounded-3xl"
        />

        <div className="mt-16 rounded-2xl border border-hairline bg-surface p-6 text-center sm:mt-24 sm:rounded-3xl sm:p-10 md:p-16">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl md:text-4xl">
            Ready to apply?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Create an account and submit your first flight application in minutes.
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
