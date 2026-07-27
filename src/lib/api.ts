const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export type ApiValidationDetails = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
};

/** Parse Zod-style validation errors returned by the Biazo API. */
export function parseApiError(err: unknown): {
  message: string;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  if (!(err instanceof ApiError)) {
    return { message: "Something went wrong", fieldErrors: {}, formErrors: [] };
  }

  const body = err.details as { details?: ApiValidationDetails } | undefined;
  const validation = body?.details;
  const fieldErrors = validation?.fieldErrors ?? {};
  const formErrors = validation?.formErrors ?? [];
  const fieldMessages = Object.values(fieldErrors).flat();

  const message =
    fieldMessages.length > 0
      ? fieldMessages.join(". ")
      : formErrors.length > 0
        ? formErrors.join(". ")
        : err.message;

  return { message, fieldErrors, formErrors };
}

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("biazo-access-token");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("biazo-refresh-token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("biazo-access-token", accessToken);
  localStorage.setItem("biazo-refresh-token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("biazo-access-token");
  localStorage.removeItem("biazo-refresh-token");
}

const USER_CACHE_KEY = "biazo-user-cache";

export function cacheUser(user: User) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearUserCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(USER_CACHE_KEY);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);

  if (!res?.ok) {
    if (res?.status === 401) clearTokens();
    return null;
  }

  const data = (await res.json()) as { accessToken: string };
  localStorage.setItem("biazo-access-token", data.accessToken);
  return data.accessToken;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers }).catch(() => {
    throw new ApiError(
      0,
      "Cannot reach Biazo API. Make sure the server is running on port 4000.",
    );
  });

  if (res.status === 401 && retry && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, init, false);
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? "Request failed", data);
  }

  return data as T;
}

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  avatarUrl: string | null;
};

export type Preferences = {
  cabinClass: string;
  seatPreference: string;
  meal: string;
  frequentFlyer: string | null;
  directFlightsOnly: boolean;
  avoidRedEyes: boolean;
  offsetCarbon: boolean;
  accountCurrency: string | null;
  language: string;
  timezone: string;
  notifyFlightStatus: boolean;
  notifyGateDelay: boolean;
  notifyFareDrops: boolean;
  notifyJournal: boolean;
  notifyProductNews: boolean;
};

export type Booking = {
  id: string;
  pnr: string;
  status: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  airline: string;
  flightNumber: string | null;
  departAt: string;
  arriveAt: string;
  cabinClass: string;
  priceMwk: number;
};

export type Ticket = {
  id: string;
  bookingId: string;
  pnr: string;
  originCode: string;
  destinationCode: string;
  originCity: string;
  destinationCity: string;
  departAt: string;
  arriveAt: string;
  airline: string;
  flightLabel: string | null;
  seat: string | null;
  gate: string | null;
  class: string;
  status: string;
  displayStatus?: "active" | "inactive" | "cancelled";
  isInactive?: boolean;
  passengerNames?: string | null;
  applicationId?: string | null;
  documentUrl?: string | null;
};

export type AccountPayload = {
  user: User;
  preferences: Preferences | null;
  travelCreditMwk: number;
  bookings: Booking[];
  tickets: Ticket[];
};

export const authApi = {
  signup: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) =>
    apiFetch<{ message: string; requiresVerification: boolean; email: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyEmail: (body: { email: string; code: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    apiFetch<{ message?: string; requiresLoginCode?: boolean; requiresVerification?: boolean; email: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
    ),

  verifyLogin: (body: { email: string; code: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>("/auth/verify-login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  forgotPassword: (body: { email: string }) =>
    apiFetch<{ message: string; email: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { email: string; code: string; password: string }) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    }),
};

export const accountApi = {
  me: () => apiFetch<AccountPayload>("/account/me"),

  updateProfile: (body: Partial<Pick<User, "firstName" | "lastName" | "phone" | "dateOfBirth" | "nationality">>) =>
    apiFetch<{ user: User }>("/account/profile", { method: "PATCH", body: JSON.stringify(body) }),

  updatePreferences: (body: Partial<Preferences>) =>
    apiFetch<{ preferences: Preferences }>("/account/preferences", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  searchCreditRecipients: (q: string) =>
    apiFetch<{
      recipients: Array<{ id: string; email: string; firstName: string; lastName: string }>;
    }>(`/account/travel-credits/recipients?q=${encodeURIComponent(q)}`),

  shareTravelCredit: (body: { recipientUserId: string; amountMwk: number; note?: string }) =>
    apiFetch<{
      message: string;
      balanceMwk: number;
      transferRef: string;
      recipient: { id: string; email: string; firstName: string; lastName: string };
    }>("/account/travel-credits/share", { method: "POST", body: JSON.stringify(body) }),
};

export type FlightSearchParams = {
  origin: string;
  destination: string;
  date: string;
};

export type FlightSearchResult = {
  departureId: string;
  routeId: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  airline: string;
  durationMinutes: number;
  cabinClass: string;
  departAt: string;
  arriveAt: string;
  seatsAvailable: number;
  priceMwk: number;
  status: string;
  gate: string | null;
};

export async function searchFlights(params: FlightSearchParams) {
  const qs = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
  });
  return apiFetch<{ results: FlightSearchResult[] }>(`/flights/search?${qs}`);
}

export async function bookFlight(departureId: string) {
  return apiFetch<{ bookingId: string; pnr: string; priceMwk: number; message: string }>(
    "/flights/book",
    { method: "POST", body: JSON.stringify({ departureId }) },
  );
}

export type ApplicationPassenger = {
  passengerType: "adult" | "child" | "infant";
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  ageYears?: number;
  isAccompanied?: boolean;
  infantSeatBooked?: boolean;
};

export type QuoteLineItem = {
  id: string;
  type: "fare" | "hotel" | "car_rental" | "extra";
  label: string;
  description: string;
  amountMwk: number;
  removable: boolean;
  removed?: boolean;
  details?: Record<string, string>;
};

export type FlightApplication = {
  id: string;
  referenceNumber: string;
  status: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  tripType: string;
  departDate: string;
  departTimePreferred: string;
  returnDate: string | null;
  returnTimePreferred: string | null;
  contactPhone: string;
  contactWhatsapp: string | null;
  cabinClass: string;
  needCarRental: boolean;
  needHotel: boolean;
  hotelRequestDetails: string | null;
  carRentalRequestDetails: string | null;
  specialWheelchair: boolean;
  wheelchairReason: string | null;
  specialMeals: boolean;
  mealsReason: string | null;
  specialSeat: boolean;
  seatPreference: string | null;
  quotedPriceMwk: number | null;
  extraChargesMwk: number;
  extraChargesNote: string | null;
  isAlternateOffer: boolean;
  adminMessage: string | null;
  quotedDepartDate: string | null;
  quotedDepartTime: string | null;
  quotedAirline: string | null;
  quotedFlightNumber: string | null;
  quoteLineItems: QuoteLineItem[];
  quoteExchangeRates?: Record<string, number>;
  totalPriceMwk: number;
  paidCurrency?: string | null;
  paidAmount?: number | null;
  customerDisplayCurrency?: string | null;
  passengers: ApplicationPassenger[];
  createdAt: string;
  updatedAt: string;
};

export type MomoOperator = { ref_id: string; name: string; country?: string };

export type PaymentLedger = {
  id: string;
  chargeId: string;
  paymentMethod: "mobile_money" | "bank" | "card" | "hosted_checkout" | "travel_credit";
  amountMwk: number;
  paymentAmount?: number;
  currency: string;
  displayCurrency?: string;
  status: "pending" | "completed" | "failed" | "expired";
  orderType: string;
  orderId: string;
  paychanguStatus: string | null;
  bankDetails: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    expiresAt: string | null;
  } | null;
  card3ds: { requires3ds: boolean; authUrl: string | null } | null;
  mobileNumber: string | null;
  mobileOperatorName: string | null;
  checkoutUrl: string | null;
  expiresAt: string;
  completedAt: string | null;
  orderFulfilled: boolean;
  createdAt: string;
};

export type PaymentConfig = {
  checkoutMode: "direct" | "hosted";
  mockMode: boolean;
};

export const paymentsApi = {
  getConfig: () => apiFetch<PaymentConfig>("/payments/config"),
  getOperators: () => apiFetch<{ operators: MomoOperator[] }>("/payments/operators"),
  getActiveForApplication: (applicationId: string) =>
    apiFetch<{ payment: PaymentLedger | null }>(`/payments/application/${applicationId}/active`),
  get: (id: string) => apiFetch<{ payment: PaymentLedger }>(`/payments/${id}`),
  verifyReturn: (txRef: string, redirectStatus?: string) => {
    const qs = redirectStatus ? `?status=${encodeURIComponent(redirectStatus)}` : "";
    return apiFetch<{
      payment: PaymentLedger;
      outcome: string;
      redirectStatus: string | null;
      verified: boolean;
    }>(`/payments/return/${encodeURIComponent(txRef)}${qs}`);
  },
  verify: (id: string) =>
    apiFetch<{ payment: PaymentLedger; outcome: string }>(`/payments/${id}/verify`, { method: "POST" }),
  initiate: (body: Record<string, unknown>) =>
    apiFetch<{
      payment: PaymentLedger;
      message?: string;
      requires3ds?: boolean;
      redirectUrl?: string;
      checkoutUrl?: string;
      resumed?: boolean;
    }>("/payments/initiate", { method: "POST", body: JSON.stringify(body) }),
  payWithTravelCredit: (body: { applicationId: string; displayCurrency?: string }) =>
    apiFetch<{ payment: PaymentLedger; balanceMwk: number; message: string }>(
      "/payments/travel-credit",
      { method: "POST", body: JSON.stringify(body) },
    ),
  getActiveCreditPurchase: () =>
    apiFetch<{ payment: PaymentLedger | null }>("/payments/travel-credits/active"),
  purchaseTravelCredits: (body: Record<string, unknown>) =>
    apiFetch<{
      payment: PaymentLedger;
      message?: string;
      requires3ds?: boolean;
      redirectUrl?: string;
      checkoutUrl?: string;
      resumed?: boolean;
    }>("/payments/travel-credits/purchase", { method: "POST", body: JSON.stringify(body) }),
};

export const applicationsApi = {
  list: () => apiFetch<{ applications: FlightApplication[] }>("/applications"),
  get: (id: string) =>
    apiFetch<{
      application: FlightApplication;
      events: { eventType: string; message: string; createdAt: string }[];
      tickets: { id: string; fileName: string; mimeType: string }[];
    }>(`/applications/${id}`),
  removeQuoteItem: (id: string, itemId: string) =>
    apiFetch<{ application: FlightApplication }>(`/applications/${id}/quote-items`, {
      method: "PATCH",
      body: JSON.stringify({ itemId }),
    }),
  create: (body: Record<string, unknown>) =>
    apiFetch<{ application: FlightApplication }>("/applications", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  payDemo: (id: string) =>
    apiFetch<{ message: string; status: string }>(`/applications/${id}/pay-demo`, { method: "POST" }),
  cancel: (id: string) =>
    apiFetch<{ message: string }>(`/applications/${id}/cancel`, { method: "POST" }),
  ticketUrl: (applicationId: string, ticketId: string) =>
    `${API_BASE}/applications/${applicationId}/tickets/${ticketId}`,
};
