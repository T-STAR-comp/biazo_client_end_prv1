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
  accountApi,
  authApi,
  ApiError,
  cacheUser,
  clearTokens,
  clearUserCache,
  readCachedUser,
  setTokens,
  type AccountPayload,
  type User,
} from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  account: AccountPayload | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ step: "code" | "verify-signup"; email: string }>;
  verifyLoginCode: (email: string, code: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) => Promise<{ email: string }>;
  verifySignupCode: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ email: string }>;
  resetPassword: (input: { email: string; code: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function hasStoredSession() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("biazo-access-token"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [loading, setLoading] = useState(() => hasStoredSession());

  const refreshAccount = useCallback(async () => {
    if (!hasStoredSession()) {
      setUser(null);
      setAccount(null);
      clearUserCache();
      return;
    }

    try {
      const data = await accountApi.me();
      setUser(data.user);
      setAccount(data);
      cacheUser(data.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setAccount(null);
        clearTokens();
        clearUserCache();
        return;
      }
      // Keep the existing session on network/server errors — do not log the user out.
      const cached = readCachedUser();
      if (cached) setUser(cached);
    }
  }, []);

  useEffect(() => {
    if (!hasStoredSession()) {
      setLoading(false);
      return;
    }
    refreshAccount().finally(() => setLoading(false));
  }, [refreshAccount]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.requiresVerification) {
      return { step: "verify-signup" as const, email: res.email };
    }
    return { step: "code" as const, email: res.email };
  }, []);

  const verifyLoginCode = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyLogin({ email, code });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    cacheUser(res.user);
    await refreshAccount();
  }, [refreshAccount]);

  const signup = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }) => {
      const res = await authApi.signup(input);
      return { email: res.email };
    },
    [],
  );

  const verifySignupCode = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyEmail({ email, code });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    cacheUser(res.user);
    await refreshAccount();
  }, [refreshAccount]);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await authApi.forgotPassword({ email });
    return { email: res.email };
  }, []);

  const resetPassword = useCallback(
    async (input: { email: string; code: string; password: string }) => {
      await authApi.resetPassword(input);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      clearUserCache();
      setUser(null);
      setAccount(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      account,
      loading,
      isAuthenticated: Boolean(user) && hasStoredSession(),
      login,
      verifyLoginCode,
      signup,
      verifySignupCode,
      forgotPassword,
      resetPassword,
      logout,
      refreshAccount,
    }),
    [user, account, loading, login, verifyLoginCode, signup, verifySignupCode, forgotPassword, resetPassword, logout, refreshAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
