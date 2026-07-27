import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/context/auth-context";
import { parseApiError } from "@/lib/api";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Biazo" },
      { name: "description", content: "Sign in to your Biazo account to manage flights and trips." },
    ],
  }),
  component: AuthPage,
});

type Step = "credentials" | "verify-signup" | "verify-login" | "forgot-email" | "forgot-reset";

const PASSWORD_RULES = [
  {
    label: "8+ characters",
    test: (p: string) => p.length >= 8,
    matchesError: (msg: string) => /8|at least/i.test(msg),
  },
  {
    label: "One number",
    test: (p: string) => /[0-9]/.test(p),
    matchesError: (msg: string) => /number/i.test(msg),
  },
  {
    label: "One uppercase",
    test: (p: string) => /[A-Z]/.test(p),
    matchesError: (msg: string) => /uppercase/i.test(msg),
  },
  {
    label: "One symbol",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    matchesError: (msg: string) => /symbol/i.test(msg),
  },
];

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { login, signup, verifyLoginCode, verifySignupCode, forgotPassword, resetPassword } = useAuth();
  const isSignup = mode === "signup";

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const clearErrors = () => {
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
  };

  const applyApiError = (err: unknown) => {
    const parsed = parseApiError(err);
    setError(parsed.message);
    setFieldErrors(parsed.fieldErrors);
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      if (isSignup) {
        const res = await signup({ email, password, firstName, lastName, dateOfBirth });
        setEmail(res.email);
        setStep("verify-signup");
      } else {
        const res = await login(email, password);
        setEmail(res.email);
        setStep(res.step === "verify-signup" ? "verify-signup" : "verify-login");
      }
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setEmail(res.email);
      setStep("forgot-reset");
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, code, password: newPassword });
      setSuccessMessage("Password updated. Sign in with your new password.");
      setPassword("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("credentials");
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      if (step === "verify-signup") {
        await verifySignupCode(email, code);
      } else {
        await verifyLoginCode(email, code);
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifying = step === "verify-signup" || step === "verify-login";
  const resetting = step === "forgot-email" || step === "forgot-reset";
  const maxBirthDate = new Date().toISOString().slice(0, 10);

  const heading = verifying
    ? "Enter the code we sent you."
    : step === "forgot-email"
      ? "Reset your password."
      : step === "forgot-reset"
        ? "Choose a new password."
        : isSignup
          ? "Start flying with Biazo."
          : "Sign in to Biazo.";

  const subheading = verifying
    ? `We sent a 6-digit code to ${email}. Codes expire in 15 minutes.`
    : step === "forgot-email"
      ? "Enter your account email and we'll send a reset code."
      : step === "forgot-reset"
        ? `Enter the 6-digit code sent to ${email} and choose a new password.`
        : isSignup
          ? "Malawi's travel agency — built in Lilongwe, for the world."
          : "Manage flights, tickets, and trips in one thread.";

  const eyebrow = verifying
    ? "Verify your email"
    : resetting
      ? "Forgot password"
      : isSignup
        ? "Create your account"
        : "Welcome back";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-6 md:px-16 md:py-14">
        <Link to="/" className="mb-8 inline-block sm:mb-12 md:mb-16">
          <Logo />
        </Link>

        <div className="mx-auto w-full max-w-md flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">
            {heading}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{subheading}</p>

          {successMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-ink"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <p className="font-medium">{error}</p>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-destructive/90">
                  {Object.entries(fieldErrors).flatMap(([field, messages]) =>
                    messages.map((message) => (
                      <li key={`${field}-${message}`}>
                        <span className="capitalize">{field.replace(/([A-Z])/g, " $1")}</span>:{" "}
                        {message}
                      </li>
                    )),
                  )}
                </ul>
              )}
            </div>
          )}

          {!verifying && !resetting && (
            <>
              <div className="mt-10">
                <button
                  type="button"
                  className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-hairline bg-surface-elevated px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-secondary"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
              </div>

              <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-px flex-1 bg-hairline" />
                or with email
                <span className="h-px flex-1 bg-hairline" />
              </div>
            </>
          )}

          {verifying ? (
            <form className="mt-8 space-y-4" onSubmit={handleVerify}>
              <Input
                label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                errors={fieldErrors.code}
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-signal mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-sm text-muted-foreground hover:text-ink"
              >
                Back
              </button>
            </form>
          ) : step === "forgot-email" ? (
            <form className="mt-8 space-y-4" onSubmit={handleForgotEmail}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                errors={fieldErrors.email}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="btn-signal mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset code"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-sm text-muted-foreground hover:text-ink"
              >
                Back to sign in
              </button>
            </form>
          ) : step === "forgot-reset" ? (
            <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
              <Input
                label="Reset code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                errors={fieldErrors.code}
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                errors={fieldErrors.password}
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <ul className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                {PASSWORD_RULES.map(({ label, test, matchesError }) => {
                  const failed = fieldErrors.password?.some(matchesError);
                  const met = test(newPassword);
                  return (
                    <li
                      key={label}
                      className={`flex items-center gap-1.5 ${
                        failed ? "text-destructive" : met ? "text-signal" : ""
                      }`}
                    >
                      <Check className="h-3 w-3 shrink-0" /> {label}
                    </li>
                  );
                })}
              </ul>
              <button
                type="submit"
                disabled={loading || code.length !== 6 || !newPassword || !confirmPassword}
                className="btn-signal mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep("forgot-email")}
                className="w-full text-center text-sm text-muted-foreground hover:text-ink"
              >
                Back
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleCredentials}>
              {isSignup && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Chisomo"
                      errors={fieldErrors.firstName}
                    />
                    <Input
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Phiri"
                      errors={fieldErrors.lastName}
                    />
                  </div>
                  <Input
                    label="Date of birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={maxBirthDate}
                    errors={fieldErrors.dateOfBirth}
                  />
                </>
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                errors={fieldErrors.email}
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    aria-invalid={Boolean(fieldErrors.password?.length)}
                    className={`w-full rounded-xl border bg-background px-4 py-3 pr-11 text-sm text-ink outline-none transition-colors focus:border-signal ${
                      fieldErrors.password?.length
                        ? "border-destructive focus:border-destructive"
                        : "border-hairline"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="touch-target absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-ink"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && fieldErrors.password.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-destructive">
                    {fieldErrors.password.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}
                {isSignup && (
                  <ul className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                    {PASSWORD_RULES.map(({ label, test, matchesError }) => {
                      const failed = fieldErrors.password?.some(matchesError);
                      const met = test(password);
                      return (
                        <li
                          key={label}
                          className={`flex items-center gap-1.5 ${
                            failed ? "text-destructive" : met ? "text-signal" : ""
                          }`}
                        >
                          <Check className="h-3 w-3 shrink-0" /> {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {!isSignup && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setStep("forgot-email");
                    }}
                    className="text-sm text-muted-foreground hover:text-ink"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-signal mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {isSignup && (
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to Biazo&apos;s{" "}
                  <Link to="/terms" className="text-ink underline underline-offset-2">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/legal" className="text-ink underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
            </form>
          )}

          {!resetting && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              {isSignup ? "Already have Biazo?" : "New to Biazo?"}{" "}
              <Link
                to="/auth"
                search={{ mode: isSignup ? "signin" : "signup" }}
                className="font-semibold text-ink hover:text-signal"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img
          src="/images/auth-travel.jpg"
          alt="Passport and coffee on a wooden table"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">From Lilongwe, Malawi</p>
          <blockquote className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.02em]">
            &ldquo;Booking a flight should feel like the first hour of the trip, not the last hour of
            the week.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-white/70">— Biazo Travel, Lilongwe</p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  errors,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  errors?: string[];
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        aria-invalid={hasError}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-signal ${
          hasError ? "border-destructive focus:border-destructive" : "border-hairline"
        }`}
      />
      {errors && errors.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-destructive">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
