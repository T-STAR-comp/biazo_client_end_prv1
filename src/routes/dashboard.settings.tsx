import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type HTMLInputTypeAttribute } from "react";
import { Bell, Globe, Lock, Plane, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";
import { accountApi, ApiError, type Preferences } from "@/lib/api";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

const groups = [
  { id: "profile", label: "Profile", icon: User },
  { id: "travel", label: "Travel preferences", icon: Plane },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "region", label: "Region & language", icon: Globe },
];

function SettingsPage() {
  const { user, account, refreshAccount } = useAuth();
  const {
    currencies,
    siteCurrency,
    accountCurrency,
    setAccountCurrency,
    effectiveCurrency,
    effectiveSource,
  } = useCurrency();

  const prefs = account?.preferences;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [travelPrefs, setTravelPrefs] = useState<Partial<Preferences>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? "");
    setDateOfBirth(user.dateOfBirth ?? "");
    setNationality(user.nationality ?? "Malawian");
  }, [user]);

  useEffect(() => {
    if (prefs) setTravelPrefs(prefs);
  }, [prefs]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    const container = contentRef.current;
    if (!section || !container) return;
    const top =
      container.scrollTop +
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      8;
    container.scrollTo({ top, behavior: "smooth" });
  };

  const saveProfile = async () => {
    setSaving("profile");
    setError(null);
    setMessage(null);
    try {
      await accountApi.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        nationality: nationality || undefined,
      });
      await refreshAccount();
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(null);
    }
  };

  const savePreferences = async (patch: Partial<Preferences>) => {
    setSaving("prefs");
    setError(null);
    setMessage(null);
    try {
      const next = { ...travelPrefs, ...patch };
      setTravelPrefs(next);
      await accountApi.updatePreferences(patch);
      if (patch.accountCurrency !== undefined) {
        setAccountCurrency(patch.accountCurrency);
      }
      await refreshAccount();
      setMessage("Preferences saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save preferences");
    } finally {
      setSaving(null);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto max-w-6xl lg:flex lg:h-[calc(100dvh-9rem)] lg:max-h-[calc(100dvh-9rem)] lg:flex-col lg:overflow-hidden">
      <div className="shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Account</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tune Biazo to the way you actually travel.
        </p>
        {(message || error) && (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              error
                ? "border border-destructive/30 bg-destructive/5 text-destructive"
                : "border border-signal/30 bg-signal-soft text-ink"
            }`}
          >
            {error ?? message}
          </p>
        )}
      </div>

      <div className="mt-10 flex min-h-0 flex-1 flex-col gap-8 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-[240px] lg:overflow-hidden">
          <nav className="space-y-1 lg:sticky lg:top-0">
            {groups.map(({ id, label, icon: Icon }, i) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) => {
                  if (window.matchMedia("(min-width: 1024px)").matches) {
                    event.preventDefault();
                    scrollToSection(id);
                  }
                }}
                className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  i === 0
                    ? "nav-active font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </a>
            ))}
          </nav>
        </aside>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain pb-4 lg:pb-2 lg:pr-2"
        >
          <Section id="profile" title="Profile" desc="How you appear on itineraries and boarding passes.">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-signal text-2xl font-semibold text-signal-foreground">
                {initials}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={firstName} onChange={setFirstName} />
              <Field label="Last name" value={lastName} onChange={setLastName} />
              <Field label="Email" value={user?.email ?? ""} readOnly />
              <Field label="Phone" value={phone} onChange={setPhone} placeholder="+265 …" />
              <Field
                label="Date of birth"
                type="date"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
              <Field label="Nationality" value={nationality} onChange={setNationality} />
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving === "profile"}
              className="btn-signal rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {saving === "profile" ? "Saving…" : "Save profile"}
            </button>
          </Section>

          <Section id="travel" title="Travel preferences" desc="Applied to every new search.">
            <div className="grid gap-4 sm:grid-cols-2">
              <PrefSelect
                label="Cabin class"
                value={travelPrefs.cabinClass ?? "Economy"}
                options={["Economy", "Economy Plus", "Business", "First"]}
                onChange={(v) => savePreferences({ cabinClass: v })}
              />
              <PrefSelect
                label="Seat preference"
                value={travelPrefs.seatPreference ?? "No preference"}
                options={["No preference", "Window", "Aisle", "Middle"]}
                onChange={(v) => savePreferences({ seatPreference: v })}
              />
              <PrefSelect
                label="Meal"
                value={travelPrefs.meal ?? "No preference"}
                options={["No preference", "Vegetarian", "Halal", "Kosher", "Gluten-free"]}
                onChange={(v) => savePreferences({ meal: v })}
              />
              <Field
                label="Frequent flyer"
                value={travelPrefs.frequentFlyer ?? ""}
                onChange={(v) => setTravelPrefs((p) => ({ ...p, frequentFlyer: v || null }))}
                placeholder="Programme & number"
              />
            </div>
            <div className="grid gap-3 rounded-xl border border-hairline bg-surface p-4 sm:grid-cols-3">
              <Toggle
                label="Direct flights only"
                on={travelPrefs.directFlightsOnly ?? true}
                onChange={(v) => savePreferences({ directFlightsOnly: v })}
              />
              <Toggle
                label="Avoid red-eyes"
                on={travelPrefs.avoidRedEyes ?? false}
                onChange={(v) => savePreferences({ avoidRedEyes: v })}
              />
              <Toggle
                label="Offset carbon automatically"
                on={travelPrefs.offsetCarbon ?? true}
                onChange={(v) => savePreferences({ offsetCarbon: v })}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                savePreferences({ frequentFlyer: travelPrefs.frequentFlyer ?? null })
              }
              disabled={saving === "prefs"}
              className="btn-ink rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              Save travel preferences
            </button>
          </Section>

          <Section id="notifications" title="Notifications">
            <div className="space-y-2">
              <Toggle
                label="Flight status updates"
                on={travelPrefs.notifyFlightStatus ?? true}
                onChange={(v) => savePreferences({ notifyFlightStatus: v })}
              />
              <Toggle
                label="Gate & delay push alerts"
                on={travelPrefs.notifyGateDelay ?? true}
                onChange={(v) => savePreferences({ notifyGateDelay: v })}
              />
              <Toggle
                label="Fare drops on saved routes"
                on={travelPrefs.notifyFareDrops ?? true}
                onChange={(v) => savePreferences({ notifyFareDrops: v })}
              />
              <Toggle
                label="Weekly travel journal email"
                on={travelPrefs.notifyJournal ?? false}
                onChange={(v) => savePreferences({ notifyJournal: v })}
              />
              <Toggle
                label="Product news from Biazo"
                on={travelPrefs.notifyProductNews ?? false}
                onChange={(v) => savePreferences({ notifyProductNews: v })}
              />
            </div>
          </Section>

          <Section id="security" title="Security">
            <div className="space-y-3">
              <Row title="Password" value="Change via sign-in flow" cta="Change" />
              <Row title="Two-factor authentication" value="Coming soon" cta="Manage" />
              <Row title="Active sessions" value="Managed on sign out" cta="View" />
            </div>
          </Section>

          <Section
            id="region"
            title="Region & language"
            desc="Personal preferences for your signed-in experience."
          >
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Account display currency
                </span>
                <UiSelect
                  value={accountCurrency ?? "site-default"}
                  onValueChange={(value) =>
                    savePreferences({
                      accountCurrency: value === "site-default" ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="h-auto min-h-[44px] rounded-xl border-hairline bg-background px-4 py-2.5 text-sm">
                    <SelectValue placeholder="Use site currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="site-default">Use site currency ({siteCurrency})</SelectItem>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} — {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UiSelect>
                <p className="text-xs text-muted-foreground">
                  Overrides the header currency while you&apos;re signed in. All rates are
                  mid-market bank rates. Currently showing{" "}
                  <span className="font-semibold text-ink">{effectiveCurrency}</span>
                  {effectiveSource === "account" ? " (your account preference)" : " (site default)"}.
                </p>
              </label>
              <PrefSelect
                label="Language"
                value={travelPrefs.language ?? "English"}
                options={["English", "Chichewa"]}
                onChange={(v) => savePreferences({ language: v })}
              />
              <PrefSelect
                label="Time zone"
                value={travelPrefs.timezone ?? "Africa/Blantyre"}
                options={["Africa/Blantyre", "Africa/Johannesburg", "Europe/London", "America/New_York"]}
                onChange={(v) => savePreferences({ timezone: v })}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-hairline bg-background p-6 md:p-8">
      <div className="mb-6 border-b border-hairline pb-4">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="rounded-xl border border-hairline bg-background px-4 py-2.5 text-sm text-ink outline-none focus:border-signal read-only:opacity-70"
      />
    </label>
  );
}

function PrefSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <UiSelect value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto min-h-[44px] rounded-xl border-hairline bg-background px-4 py-2.5 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-ink">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          on ? "bg-signal" : "bg-hairline"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Row({ title, value, cta }: { title: string; value: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
      <button className="rounded-full border border-hairline px-4 py-1.5 text-xs font-semibold text-ink hover:border-signal">
        {cta}
      </button>
    </div>
  );
}

