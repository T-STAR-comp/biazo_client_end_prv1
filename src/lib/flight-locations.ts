export type FlightLocationSuggestion = {
  code: string;
  city: string;
  label: string;
};

export const FLIGHT_LOCATION_SUGGESTIONS: FlightLocationSuggestion[] = [
  { code: "LLW", city: "Lilongwe", label: "Lilongwe (LLW)" },
  { code: "BLZ", city: "Blantyre", label: "Blantyre (BLZ)" },
  { code: "JNB", city: "Johannesburg", label: "Johannesburg (JNB)" },
  { code: "CPT", city: "Cape Town", label: "Cape Town (CPT)" },
  { code: "NBO", city: "Nairobi", label: "Nairobi (NBO)" },
  { code: "DAR", city: "Dar es Salaam", label: "Dar es Salaam (DAR)" },
  { code: "LUN", city: "Lusaka", label: "Lusaka (LUN)" },
  { code: "HRE", city: "Harare", label: "Harare (HRE)" },
  { code: "LHR", city: "London", label: "London (LHR)" },
  { code: "DXB", city: "Dubai", label: "Dubai (DXB)" },
  { code: "DOH", city: "Doha", label: "Doha (DOH)" },
  { code: "JFK", city: "New York", label: "New York (JFK)" },
  { code: "LAX", city: "Los Angeles", label: "Los Angeles (LAX)" },
  { code: "CDG", city: "Paris", label: "Paris (CDG)" },
  { code: "FRA", city: "Frankfurt", label: "Frankfurt (FRA)" },
  { code: "ADD", city: "Addis Ababa", label: "Addis Ababa (ADD)" },
  { code: "ACC", city: "Accra", label: "Accra (ACC)" },
  { code: "LOS", city: "Lagos", label: "Lagos (LOS)" },
  { code: "CAI", city: "Cairo", label: "Cairo (CAI)" },
  { code: "IST", city: "Istanbul", label: "Istanbul (IST)" },
  { code: "SIN", city: "Singapore", label: "Singapore (SIN)" },
  { code: "BKK", city: "Bangkok", label: "Bangkok (BKK)" },
  { code: "SYD", city: "Sydney", label: "Sydney (SYD)" },
  { code: "YYZ", city: "Toronto", label: "Toronto (YYZ)" },
];

export function parseLocationInput(input: string): { code: string; city: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter a city or airport");
  }

  const known = FLIGHT_LOCATION_SUGGESTIONS.find(
    (s) =>
      s.label.toLowerCase() === trimmed.toLowerCase() ||
      s.code.toLowerCase() === trimmed.toLowerCase() ||
      s.city.toLowerCase() === trimmed.toLowerCase(),
  );
  if (known) {
    return { code: known.code, city: known.city };
  }

  const parenMatch = trimmed.match(/^(.+?)\s*\(([A-Za-z]{3})\)\s*$/);
  if (parenMatch) {
    return { code: parenMatch[2]!.toUpperCase(), city: parenMatch[1]!.trim() };
  }

  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return { code: trimmed.toUpperCase(), city: trimmed.toUpperCase() };
  }

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  const code = (letters.slice(0, 3) || "ZZZ").toUpperCase().padEnd(3, "X");
  return { code, city: trimmed.slice(0, 100) };
}
