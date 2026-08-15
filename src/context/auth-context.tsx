import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
const ACCOUNT_QUERY_KEY = ["account", "me"] as const;

function hasStoredSession() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("biazo-access-token"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const sessionActive = hasStoredSession();

  const accountQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: accountApi.me,
    enabled: sessionActive,
    staleTime: 5 * 60 * 1000,
  });

  const account = accountQuery.data ?? null;
  const loading = sessionActive && accountQuery.isLoading && !account;

  useEffect(() => {
    if (account?.user) {
      setUser(account.user);
      cacheUser(account.user);
    }
  }, [account]);

  const refreshAccount = useCallback(async () => {
    if (!hasStoredSession()) {
      setUser(null);
      clearUserCache();
      queryClient.removeQueries({ queryKey: ACCOUNT_QUERY_KEY });
      return;
    }

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ACCOUNT_QUERY_KEY,
        queryFn: accountApi.me,
        staleTime: 5 * 60 * 1000,
      });
      setUser(data.user);
      cacheUser(data.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        clearTokens();
        clearUserCache();
        queryClient.removeQueries({ queryKey: ACCOUNT_QUERY_KEY });
        return;
      }
      const cached = readCachedUser();
      if (cached) setUser(cached);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!sessionActive) return;
    if (accountQuery.isError) {
      const err = accountQuery.error;
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        clearTokens();
        clearUserCache();
      }
    }
  }, [sessionActive, accountQuery.isError, accountQuery.error]);

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
    await queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
  }, [queryClient]);

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
    await queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
  }, [queryClient]);

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
      queryClient.removeQueries({ queryKey: ACCOUNT_QUERY_KEY });
    }
  }, [queryClient]);

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
