import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-screen";
import type { ApplicationPassenger } from "@/lib/api";

const DESTINATIONS = [
  { code: "LLW", city: "Lilongwe", label: "Lilongwe (LLW)" },
  { code: "BLZ", city: "Blantyre", label: "Blantyre (BLZ)" },
  { code: "JNB", city: "Johannesburg", label: "Johannesburg (JNB)" },
  { code: "NBO", city: "Nairobi", label: "Nairobi (NBO)" },
  { code: "DAR", city: "Dar es Salaam", label: "Dar es Salaam (DAR)" },
];

const emptyPassenger = (type: ApplicationPassenger["passengerType"] = "adult"): ApplicationPassenger => ({
  passengerType: type,
  firstName: "",
  lastName: "",
});

export function FlightApplicationForm({ onSubmitted }: { onSubmitted: (ref: string) => void }) {
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [origin, setOrigin] = useState("LLW");
  const [destination, setDestination] = useState("BLZ");
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

  const originMeta = DESTINATIONS.find((d) => d.code === origin) ?? DESTINATIONS[0];
  const destMeta = DESTINATIONS.find((d) => d.code === destination) ?? DESTINATIONS[1];

  const updatePassenger = (index: number, patch: Partial<ApplicationPassenger>) => {
    setPassengers((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { applicationsApi } = await import("@/lib/api");
      const res = await applicationsApi.create({
        originCode: origin,
        originCity: originMeta.city,
        destinationCode: destination,
        destinationCity: destMeta.city,
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
      setError(err instanceof Error ? err.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {submitting && <LoadingOverlay label="Submitting your request" />}
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Route</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass}>
              {DESTINATIONS.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </Field>
          <Field label="To">
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass}>
              {DESTINATIONS.filter((d) => d.code !== origin).map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Trip">
            <div className="flex gap-2">
              {(["oneway", "roundtrip"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${tripType === t ? "nav-active font-semibold text-foreground" : "bg-surface text-muted-foreground"}`}
                >
                  {t === "oneway" ? "One way" : "Return"}
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

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Phone (calls)">
            <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+265..." className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+265..." className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Passengers</h2>
          <button
            type="button"
            onClick={() => setPassengers((p) => [...p, emptyPassenger()])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-signal"
          >
            <Plus className="h-3.5 w-3.5" /> Add passenger
          </button>
        </div>
        <div className="mt-4 space-y-4">
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
                  <button type="button" onClick={() => setPassengers((list) => list.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
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
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" checked={p.isAccompanied ?? false} onChange={(e) => updatePassenger(i, { isAccompanied: e.target.checked })} />
                      Accompanied by adult
                    </label>
                  </>
                )}
                {p.passengerType === "infant" && (
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={p.infantSeatBooked ?? false} onChange={(e) => updatePassenger(i, { infantSeatBooked: e.target.checked })} />
                    Book a seat for infant (extra charge may apply)
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Extras & special services</h2>
        <div className="mt-4 space-y-4">
          <Toggle label="Car rental at destination" checked={needCarRental} onChange={setNeedCarRental} />
          {needCarRental && (
            <textarea
              required
              value={carRentalRequestDetails}
              onChange={(e) => setCarRentalRequestDetails(e.target.value)}
              placeholder="Describe what you need — e.g. SUV for 3 days, airport pickup only, drop-off at hostel, driver included…"
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
              placeholder="Describe what you need — e.g. 3-star hotel, 2 nights, twin room near city centre, breakfast included…"
              className={inputClass}
              rows={3}
            />
          )}
          <Toggle label="Wheelchair assistance" checked={specialWheelchair} onChange={setSpecialWheelchair} />
          {specialWheelchair && (
            <textarea value={wheelchairReason} onChange={(e) => setWheelchairReason(e.target.value)} placeholder="Reason / mobility requirements" className={inputClass} rows={2} />
          )}
          <Toggle label="Special meals" checked={specialMeals} onChange={setSpecialMeals} />
          {specialMeals && (
            <textarea value={mealsReason} onChange={(e) => setMealsReason(e.target.value)} placeholder="Dietary requirements" className={inputClass} rows={2} />
          )}
          <Toggle label="Seat preference" checked={specialSeat} onChange={setSpecialSeat} />
          {specialSeat && (
            <input value={seatPreference} onChange={(e) => setSeatPreference(e.target.value)} placeholder="e.g. window, extra legroom, specific row" className={inputClass} />
          )}
        </div>
      </section>

      {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-signal w-full rounded-2xl py-4 text-sm font-semibold sm:w-auto sm:px-10 disabled:opacity-60">
        Submit availability request
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-background px-4 py-2.5 text-sm outline-none focus:border-signal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--signal)]" />
    </label>
  );
}
