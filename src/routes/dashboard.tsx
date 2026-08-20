import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Bell,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
  Ticket,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LoadingScreen } from "@/components/loading-screen";
import { CurrencySelector, FormattedPrice } from "@/components/currency-selector";
import { TravelCreditUiProvider, useTravelCreditUi } from "@/context/travel-credit-ui-context";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";
import { paymentsApi } from "@/lib/api";
import { WhatsAppHelp } from "@/components/whatsapp-help";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - Biazo" },
      { name: "description", content: "Manage your flights, tickets and account with Biazo." },
    ],
  }),
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", shortLabel: "Home", icon: Home, exact: true },
  { to: "/dashboard/book", label: "Request a quote", shortLabel: "Quote", icon: Search },
  { to: "/dashboard/applications", label: "My flight requests", shortLabel: "Requests", icon: FileText },
  { to: "/dashboard/tickets", label: "Tickets", shortLabel: "Tickets", icon: Ticket },
  { to: "/dashboard/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

function DashboardLayout() {
  return (
    <TravelCreditUiProvider>
      <DashboardLayoutInner />
    </TravelCreditUiProvider>
  );
}

function DashboardLayoutInner() {
  const navigate = useNavigate();
  const { user, account, loading, isAuthenticated, logout, refreshAccount } = useAuth();
  const { setAccountCurrency } = useCurrency();
  const { openTravelCredits } = useTravelCreditUi();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const creditPurchase = params.get("creditPurchase");
    if (!creditPurchase) return;

    openTravelCredits("buy");

    const txRef = params.get("tx_ref");
    if (creditPurchase === "callback" && txRef) {
      const status = params.get("status") ?? undefined;
      void paymentsApi.verifyReturn(txRef, status).then(() => refreshAccount()).finally(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
    } else if (creditPurchase === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [openTravelCredits, refreshAccount]);

  useEffect(() => {
    if (account?.preferences) {
      setAccountCurrency(account.preferences.accountCurrency);
    }
  }, [account?.preferences, setAccountCurrency]);

  const handleSignOut = async () => {
    await logout();
    navigate({ to: "/auth", search: { mode: "signin" } });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <LoadingScreen label="Loading your account" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" search={{ mode: "signin" }} />;
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "BZ";
  const displayName = user ? `${user.firstName} ${user.lastName[0]}.` : "Member";

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-hairline bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-hairline px-6">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-hidden p-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Travel
          </p>
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{
                className: "nav-active font-semibold text-foreground hover:text-foreground",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0 border-t border-hairline p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
              <Link to="/" className="shrink-0">
                <Logo compact />
              </Link>
            </div>

              <div className="hidden flex-1 items-center gap-2 lg:flex">
              <div className="btn-inert flex w-full max-w-md items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4 shrink-0" />
                <span>Search coming soon</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <CurrencySelector className="hidden sm:flex" />
              <button
                type="button"
                disabled
                title="Notifications coming soon"
                className="btn-inert touch-target hidden items-center justify-center rounded-full border border-hairline sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openTravelCredits()}
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-xs text-muted-foreground hover:border-signal/40 hover:text-ink"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  <FormattedPrice amountMwk={account?.travelCreditMwk ?? 0} /> travel credit
                </span>
                <span className="sm:hidden">Credit</span>
              </button>
              <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-elevated py-1 pl-1 pr-2 sm:pr-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-signal text-[11px] font-semibold text-signal-foreground sm:h-7 sm:w-7">
                  {initials}
                </div>
                <div className="hidden text-xs leading-tight md:block">
                  <div className="font-semibold text-foreground">{displayName}</div>
                  <div className="text-muted-foreground">Biazo member</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-10 lg:py-10 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hairline bg-surface/95 backdrop-blur lg:hidden">
        {nav.map(({ to, label, shortLabel, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "text-signal" }}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{shortLabel ?? label}</span>
          </Link>
        ))}
      </nav>

      <WhatsAppHelp />
    </div>
  );
}

