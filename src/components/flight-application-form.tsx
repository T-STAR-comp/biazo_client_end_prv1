import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-screen";
import type { ApplicationPassenger } from "@/lib/api";
import { FLIGHT_LOCATION_SUGGESTIONS, parseLocationInput } from "@/lib/flight-locations";

const STEPS = ["Your trip", "Passengers", "Contact & extras"] as const;

const emptyPassenger = (type: ApplicationPassenger["passengerType"] = "adult"): ApplicationPassenger => ({
  passengerType: type,
  firstName: "",
  lastName: "",
});

export function FlightApplicationForm({ onSubmitted }: { onSubmitted: (ref: string) => void }) {
  const [step, setStep] = useState(0);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [originInput, setOriginInput] = useState("Lilongwe (LLW)");
  const [destinationInput, setDestinationInput] = useState("Johannesburg (JNB)");
  const [departDate, setDepartDate] = useState("");
  const [departTime, setDepartTime] = useState("08:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("18:00");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [cabinClass, setCabinClass] = useState("Economy");
  const [needCarRental, setNeedCarRental] = useState(false);
  const [needHotel, setNeedHotel] = useState(false);
  const [carRentalRequestDetails, setCarRentalRequestDetails] = useState("");
  const [hotelRequestDetails, setHotelRequestDetails] = useState("");
  const [specialWheelchair, setSpecialWheelchair] = useState(false);
  const [wheelchairReason, setWheelchairReason] = useState("");
  const [specialMeals, setSpecialMeals] = useState(false);
  const [mealsReason, setMealsReason] = useState("");
  const [specialSeat, setSpecialSeat] = useState(false);
  const [seatPreference, setSeatPreference] = useState("");
  const [passengers, setPassengers] = useState<ApplicationPassenger[]>([emptyPassenger()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const updatePassenger = (index: number, patch: Partial<ApplicationPassenger>) => {
    setPassengers((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!originInput.trim() || !destinationInput.trim()) return "Please enter where you're flying from and to.";
      if (!departDate) return "Please choose a departure date.";
      if (tripType === "roundtrip" && !returnDate) return "Please choose a return date.";
    }
    if (index === 1) {
      for (const p of passengers) {
        if (!p.firstName.trim() || !p.lastName.trim()) return "Please enter each passenger's first and last name.";
      }
    }
    if (index === 2) {
      if (!contactPhone.trim()) return "Please enter a phone number so we can reach you.";
      if (needCarRental && !carRentalRequestDetails.trim()) return "Please describe the car rental you need.";
      if (needHotel && !hotelRequestDetails.trim()) return "Please describe the hotel you need.";
    }
    return null;
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = validateStep(2);
    if (message) {
      setStepError(message);
      return;
    }
    setError(null);
    setStepError(null);
    setSubmitting(true);
    try {
      const origin = parseLocationInput(originInput);
      const destination = parseLocationInput(destinationInput);
      const { applicationsApi } = await import("@/lib/api");
      const res = await applicationsApi.create({
        originCode: origin.code,
        originCity: origin.city,
        destinationCode: destination.code,
        destinationCity: destination.city,
        tripType,
        departDate,
        departTimePreferred: departTime,
        returnDate: tripType === "roundtrip" ? returnDate : undefined,
        returnTimePreferred: tripType === "roundtrip" ? returnTime : undefined,
        contactPhone,
        contactWhatsapp: contactWhatsapp || undefined,
        cabinClass,
        needCarRental,
        needHotel,
        carRentalRequestDetails: needCarRental ? carRentalRequestDetails : undefined,
        hotelRequestDetails: needHotel ? hotelRequestDetails : undefined,
        specialWheelchair,
        wheelchairReason: specialWheelchair ? wheelchairReason : undefined,
        specialMeals,
        mealsReason: specialMeals ? mealsReason : undefined,
        specialSeat,
        seatPreference: specialSeat ? seatPreference : undefined,
        passengers,
      });
      onSubmitted(res.application.referenceNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {submitting && <LoadingOverlay label="Sending your request" />}

      <nav aria-label="Form progress" className="glass-panel rounded-2xl p-4 sm:p-5">
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {STEPS.map((label, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    active ? "bg-signal text-signal-foreground" : done ? "bg-signal-soft text-signal" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-sm ${active ? "font-semibold text-ink" : "text-muted-foreground"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 0 && (
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Where do you want to go?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us your route and travel dates.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <LocationInput
              id="origin-locations"
              label="Flying from"
              value={originInput}
              onChange={setOriginInput}
              placeholder="e.g. Lilongwe (LLW)"
            />
            <LocationInput
              id="destination-locations"
              label="Flying to"
              value={destinationInput}
              onChange={setDestinationInput}
              placeholder="e.g. Dubai (DXB)"
            />
            <Field label="Trip type">
              <div className="flex gap-2">
                {(["oneway", "roundtrip"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`flex-1 rounded-xl px-3 py-3 text-base font-medium ${tripType === t ? "nav-active font-semibold text-foreground" : "bg-surface text-muted-foreground"}`}
                  >
                    {t === "oneway" ? "One way" : "Return trip"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Cabin class">
              <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className={inputClass}>
                {["Economy", "Premium Economy", "Business", "First"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Departure date">
              <input type="date" required value={departDate} onChange={(e) => setDepartDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Preferred departure time">
              <input type="time" required value={departTime} onChange={(e) => setDepartTime(e.target.value)} className={inputClass} />
            </Field>
            {tripType === "roundtrip" && (
              <>
                <Field label="Return date">
                  <input type="date" required value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Preferred return time">
                  <input type="time" required value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Who is travelling?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter names exactly as they appear on passports.</p>
            </div>
            <button
              type="button"
              onClick={() => setPassengers((p) => [...p, emptyPassenger()])}
              className="inline-flex items-center gap-1 text-sm font-semibold text-signal"
            >
              <Plus className="h-4 w-4" /> Add person
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {passengers.map((p, i) => (
              <div key={i} className="rounded-xl border border-hairline bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <select
                    value={p.passengerType}
                    onChange={(e) => updatePassenger(i, { passengerType: e.target.value as ApplicationPassenger["passengerType"] })}
                    className={inputClass}
                  >
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                    <option value="infant">Infant</option>
                  </select>
                  {passengers.length > 1 && (
                    <button type="button" onClick={() => setPassengers((list) => list.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove passenger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required placeholder="First name" value={p.firstName} onChange={(e) => updatePassenger(i, { firstName: e.target.value })} className={inputClass} />
                  <input required placeholder="Last name" value={p.lastName} onChange={(e) => updatePassenger(i, { lastName: e.target.value })} className={inputClass} />
                  {(p.passengerType === "child" || p.passengerType === "infant") && (
                    <>
                      <input type="date" placeholder="Date of birth" value={p.dateOfBirth ?? ""} onChange={(e) => updatePassenger(i, { dateOfBirth: e.target.value })} className={inputClass} />
                      <input type="number" min={0} max={17} placeholder="Age (years)" value={p.ageYears ?? ""} onChange={(e) => updatePassenger(i, { ageYears: Number(e.target.value) })} className={inputClass} />
                      <label className="flex items-center gap-2 text-base sm:col-span-2">
                        <input type="checkbox" checked={p.isAccompanied ?? false} onChange={(e) => updatePassenger(i, { isAccompanied: e.target.checked })} />
                        Travelling with an adult
                      </label>
                    </>
                  )}
                  {p.passengerType === "infant" && (
                    <label className="flex items-center gap-2 text-base sm:col-span-2">
                      <input type="checkbox" checked={p.infantSeatBooked ?? false} onChange={(e) => updatePassenger(i, { infantSeatBooked: e.target.checked })} />
                      Book a seat for this infant (extra charge may apply)
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <>
          <section className="glass-panel rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">How can we reach you?</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you when your quote is ready.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Phone number">
                <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+265 99 123 4567" className={inputClass} />
              </Field>
              <Field label="WhatsApp (optional)">
                <input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+265 99 123 4567" className={inputClass} />
              </Field>
            </div>
          </section>

          <details className="glass-panel rounded-2xl p-5 sm:p-6">
            <summary className="cursor-pointer text-lg font-semibold text-ink">Optional extras & special help</summary>
            <p className="mt-2 text-sm text-muted-foreground">Only open this if you need a hotel, car hire, meals, or mobility assistance.</p>
            <div className="mt-5 space-y-4">
              <Toggle label="Car rental at destination" checked={needCarRental} onChange={setNeedCarRental} />
              {needCarRental && (
                <textarea
                  required
                  value={carRentalRequestDetails}
                  onChange={(e) => setCarRentalRequestDetails(e.target.value)}
                  placeholder="e.g. SUV for 3 days, airport pickup, drop-off at hotel…"
                  className={inputClass}
                  rows={3}
                />
              )}
              <Toggle label="Hotel accommodation" checked={needHotel} onChange={setNeedHotel} />
              {needHotel && (
                <textarea
                  required
                  value={hotelRequestDetails}
                  onChange={(e) => setHotelRequestDetails(e.target.value)}
                  placeholder="e.g. 2 nights, twin room, breakfast included…"
                  className={inputClass}
                  rows={3}
                />
              )}
              <Toggle label="Wheelchair assistance" checked={specialWheelchair} onChange={setSpecialWheelchair} />
              {specialWheelchair && (
                <textarea value={wheelchairReason} onChange={(e) => setWheelchairReason(e.target.value)} placeholder="Tell us what help you need at the airport" className={inputClass} rows={2} />
              )}
              <Toggle label="Special meals" checked={specialMeals} onChange={setSpecialMeals} />
              {specialMeals && (
                <textarea value={mealsReason} onChange={(e) => setMealsReason(e.target.value)} placeholder="Dietary requirements" className={inputClass} rows={2} />
              )}
              <Toggle label="Seat preference" checked={specialSeat} onChange={setSpecialSeat} />
              {specialSeat && (
                <input value={seatPreference} onChange={(e) => setSeatPreference(e.target.value)} placeholder="e.g. window seat, extra legroom" className={inputClass} />
              )}
            </div>
          </details>
        </>
      )}

      {(stepError || error) && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive">
          {stepError ?? error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 0 && (
          <button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-2xl border border-hairline px-6 py-3.5 text-base font-medium">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={goNext} className="btn-signal inline-flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold sm:flex-none sm:px-10">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="submit" disabled={submitting} className="btn-signal flex-1 rounded-2xl py-3.5 text-base font-semibold sm:flex-none sm:px-10 disabled:opacity-60">
            Send my request
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-background px-4 py-3 text-base outline-none focus:border-signal";

function LocationInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <input
        list={id}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <datalist id={id}>
        {FLIGHT_LOCATION_SUGGESTIONS.map((s) => (
          <option key={s.code} value={s.label} />
        ))}
      </datalist>
      <span className="mt-1 block text-sm text-muted-foreground">Pick a suggestion or type any city or airport</span>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3.5">
      <span className="text-base font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--signal)]" />
    </label>
  );
}
