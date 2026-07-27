import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  convertFromMwk,
  formatPriceFromMwk,
  getCurrency,
} from "@/lib/currencies";

const SITE_CURRENCY_KEY = "biazo-site-currency";
const ACCOUNT_CURRENCY_KEY = "biazo-account-currency";

type CurrencyContextValue = {
  currencies: typeof CURRENCIES;
  siteCurrency: string;
  setSiteCurrency: (code: string) => void;
  accountCurrency: string | null;
  setAccountCurrency: (code: string | null) => void;
  effectiveCurrency: string;
  effectiveSource: "site" | "account";
  formatPrice: (amountMwk: number) => string;
  convertFromMwk: (amountMwk: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [siteCurrency, setSiteCurrencyState] = useState(DEFAULT_CURRENCY);
  const [accountCurrency, setAccountCurrencyState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedSite = readStorage(SITE_CURRENCY_KEY);
    const storedAccount = readStorage(ACCOUNT_CURRENCY_KEY);
    if (storedSite && getCurrency(storedSite)) {
      setSiteCurrencyState(storedSite);
    }
    if (storedAccount && getCurrency(storedAccount)) {
      setAccountCurrencyState(storedAccount);
    }
    setHydrated(true);
  }, []);

  const setSiteCurrency = useCallback((code: string) => {
    if (!getCurrency(code)) return;
    setSiteCurrencyState(code);
    writeStorage(SITE_CURRENCY_KEY, code);
  }, []);

  const setAccountCurrency = useCallback((code: string | null) => {
    if (code !== null && !getCurrency(code)) return;
    setAccountCurrencyState(code);
    writeStorage(ACCOUNT_CURRENCY_KEY, code);
  }, []);

  const effectiveCurrency = accountCurrency ?? siteCurrency;
  const effectiveSource: "site" | "account" = accountCurrency ? "account" : "site";

  const formatPrice = useCallback(
    (amountMwk: number) => formatPriceFromMwk(amountMwk, effectiveCurrency),
    [effectiveCurrency],
  );

  const convert = useCallback(
    (amountMwk: number) => convertFromMwk(amountMwk, effectiveCurrency),
    [effectiveCurrency],
  );

  const value = useMemo(
    () => ({
      currencies: CURRENCIES,
      siteCurrency: hydrated ? siteCurrency : DEFAULT_CURRENCY,
      setSiteCurrency,
      accountCurrency,
      setAccountCurrency,
      effectiveCurrency: hydrated ? effectiveCurrency : DEFAULT_CURRENCY,
      effectiveSource,
      formatPrice,
      convertFromMwk: convert,
    }),
    [
      hydrated,
      siteCurrency,
      setSiteCurrency,
      accountCurrency,
      setAccountCurrency,
      effectiveCurrency,
      effectiveSource,
      formatPrice,
      convert,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
